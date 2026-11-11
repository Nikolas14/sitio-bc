import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/api/supabase';
import { IAttendance } from '@/types';

type AttendanceRow = Pick<IAttendance, 'id' | 'employee_id' | 'confirmed' | 'present'>;
export interface AttendanceEntry {
  confirmed: boolean; // confirmou no grupo do WhatsApp
  present: boolean | null; // quem realmente foi; null = ainda não lançado
}

const EMPTY: AttendanceEntry = { confirmed: false, present: null };
const isEmpty = (entry: AttendanceEntry) => !entry.confirmed && entry.present === null;

/**
 * Chamada de um dia (YYYY-MM-DD) em duas etapas:
 * - lista de chamada: marcar quem confirmou (`confirmed`);
 * - frequência: marcar quem realmente foi (`present`). Quem confirmou entra como presente
 *   até ser marcado como falta.
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
            .select('id, employee_id, confirmed, present')
            .eq('work_date', workDate);

        if (error) {
            setError(error.message);
        } else {
            const rows = (data ?? []) as AttendanceRow[];
            setError(null);
            setSavedRows(rows);
            setDraft(Object.fromEntries(rows.map((row) => [
                row.employee_id,
                { confirmed: row.confirmed, present: row.present },
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

    // Status na frequência real: quem confirmou é presumido presente até ser marcado.
    const presentOf = (employeeId: string): boolean | null => {
        const entry = entryOf(employeeId);
        if (entry.present !== null) return entry.present;
        return entry.confirmed ? true : null;
    };

    const toggleConfirmed = (employeeId: string) => {
        setDraft((prev) => {
            const current = prev[employeeId] ?? EMPTY;
            return { ...prev, [employeeId]: { ...current, confirmed: !current.confirmed } };
        });
    };

    // Clicar no status que já está marcado limpa a marcação.
    const setPresent = (employeeId: string, present: boolean) => {
        setDraft((prev) => {
            const current = prev[employeeId] ?? EMPTY;
            const next = current.present === present ? null : present;
            return { ...prev, [employeeId]: { ...current, present: next } };
        });
    };

    /**
     * 'lista': grava só as confirmações.
     * 'frequencia': grava a presença real; quem confirmou e não foi marcado como falta vira presente.
     */
    const save = async (stage: 'lista' | 'frequencia'): Promise<string | null> => {
        setSaving(true);

        const resolve = (employeeId: string): AttendanceEntry => {
            const entry = entryOf(employeeId);
            if (stage === 'frequencia' && entry.confirmed && entry.present === null) {
                return { ...entry, present: true };
            }
            return entry;
        };

        const upserts = Object.keys(draft)
            .map((employeeId) => ({ employeeId, entry: resolve(employeeId) }))
            .filter(({ entry }) => !isEmpty(entry))
            .map(({ employeeId, entry }) => ({
                employee_id: employeeId,
                work_date: workDate,
                confirmed: entry.confirmed,
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

    return { loading, saving, error, entryOf, presentOf, toggleConfirmed, setPresent, save };
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
