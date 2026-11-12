import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/api/supabase';
import { IAttendance } from '@/types';
import { addDays } from '@/utils/dates';

type AttendanceRow = Pick<IAttendance, 'id' | 'employee_id' | 'confirmed' | 'frango' | 'boi' | 'received_chicken' | 'present'>;
export interface AttendanceEntry {
  confirmed: boolean; // vai em pelo menos um abate (vem da lista de chamada)
  frango: boolean; // confirmou para o frango
  boi: boolean; // confirmou para o boi
  receivedChicken: boolean; // recebeu o frango
  present: boolean | null; // quem realmente foi; null = ainda não lançado
}

const EMPTY: AttendanceEntry = { confirmed: false, frango: false, boi: false, receivedChicken: false, present: null };
const isEmpty = (entry: AttendanceEntry) => !entry.confirmed && entry.present === null;

/**
 * Frequência real de um dia (YYYY-MM-DD). Parte de quem está na lista de chamada:
 * quem confirmou entra como presente até ser marcado como falta.
 */
export function useAttendanceDay(workDate: string) {
    const [savedRows, setSavedRows] = useState<AttendanceRow[]>([]);
    const [draft, setDraft] = useState<Record<string, AttendanceEntry>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ESTOQUE_employee_attendance')
            .select('id, employee_id, confirmed, frango, boi, received_chicken, present')
            .eq('work_date', workDate);

        if (error) {
            setError(error.message);
        } else {
            const rows = (data ?? []) as AttendanceRow[];
            setError(null);
            setSavedRows(rows);
            setDraft(Object.fromEntries(rows.map((row) => [
                row.employee_id,
                {
                    confirmed: row.confirmed,
                    frango: row.frango,
                    boi: row.boi,
                    receivedChicken: row.received_chicken,
                    present: row.present,
                },
            ])));
        }
        setLoading(false);
    }, [workDate]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void load();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [load]);

    const entryOf = (employeeId: string): AttendanceEntry => draft[employeeId] ?? EMPTY;

    // Status na frequência real: quem está na lista é presumido presente até ser marcado.
    const presentOf = (employeeId: string): boolean | null => {
        const entry = entryOf(employeeId);
        if (entry.present !== null) return entry.present;
        return entry.confirmed ? true : null;
    };

    // Clicar no status que já está marcado limpa a marcação.
    const setPresent = (employeeId: string, present: boolean) => {
        setDraft((prev) => {
            const current = prev[employeeId] ?? EMPTY;
            const next = current.present === present ? null : present;
            // Quem foi marcado como falta não recebe frango.
            const receivedChicken = next === false ? false : current.receivedChicken;
            return { ...prev, [employeeId]: { ...current, present: next, receivedChicken } };
        });
    };

    const setReceivedChicken = (employeeId: string, value: boolean) => {
        setDraft((prev) => {
            const current = prev[employeeId] ?? EMPTY;
            return { ...prev, [employeeId]: { ...current, receivedChicken: value } };
        });
    };

    // Grava a presença real. Quem está na lista e não foi marcado como falta vira presente.
    // A lista (frango/boi) não é alterada aqui.
    const save = async (): Promise<string | null> => {
        setSaving(true);

        const resolve = (employeeId: string): AttendanceEntry => {
            const entry = entryOf(employeeId);
            if (entry.confirmed && entry.present === null) return { ...entry, present: true };
            return entry;
        };

        const upserts = Object.keys(draft)
            .map((employeeId) => ({ employeeId, entry: resolve(employeeId) }))
            .filter(({ entry }) => !isEmpty(entry))
            .map(({ employeeId, entry }) => ({
                employee_id: employeeId,
                work_date: workDate,
                confirmed: entry.confirmed,
                received_chicken: entry.receivedChicken,
                present: entry.present,
            }));

        const removeIds = savedRows
            .filter((row) => isEmpty(resolve(row.employee_id)))
            .map((row) => row.id);

        if (upserts.length > 0) {
            const { error } = await supabase
                .from('ESTOQUE_employee_attendance')
                .upsert(upserts, { onConflict: 'employee_id,work_date' });
            if (error) {
                setError(error.message);
                setSaving(false);
                return error.message;
            }
        }

        if (removeIds.length > 0) {
            const { error } = await supabase.from('ESTOQUE_employee_attendance').delete().in('id', removeIds);
            if (error) {
                setError(error.message);
                setSaving(false);
                return error.message;
            }
        }

        setError(null);
        setSaving(false);
        await load();
        return null;
    };

    return { loading, saving, error, entryOf, presentOf, setPresent, setReceivedChicken, save };
}

/** Todas as chamadas de um funcionário, da mais recente para a mais antiga. */
export function useEmployeeAttendance(employeeId: string | null) {
    const [rows, setRows] = useState<Pick<IAttendance, 'work_date' | 'confirmed' | 'present'>[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!employeeId) return;

        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            setLoading(true);
            setRows([]);
            const { data, error } = await supabase
                .from('ESTOQUE_employee_attendance')
                .select('work_date, confirmed, present')
                .eq('employee_id', employeeId)
                .order('work_date', { ascending: false });

            if (cancelled) return;
            if (error) {
                setError(error.message);
            } else {
                setError(null);
                setRows((data ?? []) as Pick<IAttendance, 'work_date' | 'confirmed' | 'present'>[]);
            }
            setLoading(false);
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [employeeId]);

    return { rows: employeeId ? rows : [], loading, error };
}

export interface AttendanceWeekRow {
  employee_id: string;
  work_date: string;
  confirmed: boolean;
  present: boolean | null;
}

/** Lista de chamada e presença de uma semana (segunda a domingo). Null se a consulta falhar. */
export async function fetchAttendanceWeek(weekStart: string): Promise<AttendanceWeekRow[] | null> {
    const { data, error } = await supabase
        .from('ESTOQUE_employee_attendance')
        .select('employee_id, work_date, confirmed, present')
        .gte('work_date', weekStart)
        .lte('work_date', addDays(weekStart, 6));

    if (error) return null;
    return (data ?? []) as AttendanceWeekRow[];
}
