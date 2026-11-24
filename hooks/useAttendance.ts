import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/api/supabase';
import { IAttendance } from '@/types';
import { addDays } from '@/utils/dates';
import type { AbateKind } from '@/hooks/useConfirmationList';

type AttendanceRow = Pick<
    IAttendance,
    'id' | 'employee_id' | 'confirmed' | 'frango' | 'boi' | 'received_chicken' | 'present_frango' | 'present_boi'
>;
export interface AttendanceEntry {
  confirmed: boolean; // vai em pelo menos um abate (vem da lista de chamada)
  frango: boolean; // confirmou para o frango
  boi: boolean; // confirmou para o boi
  receivedChicken: boolean; // recebeu o frango
  presentFrango: boolean | null; // foi no frango; null = ainda não lançado
  presentBoi: boolean | null; // foi no boi; null = ainda não lançado
}

export interface SemanaAbates {
  frango: boolean;
  boi: boolean;
}

const EMPTY: AttendanceEntry = {
  confirmed: false,
  frango: false,
  boi: false,
  receivedChicken: false,
  presentFrango: null,
  presentBoi: null,
};
const isEmpty = (entry: AttendanceEntry) => !entry.confirmed && entry.presentFrango === null && entry.presentBoi === null;

// Campo do rascunho que guarda a presença de cada abate.
const CAMPO_PRESENTE: Record<AbateKind, 'presentFrango' | 'presentBoi'> = { frango: 'presentFrango', boi: 'presentBoi' };

/**
 * Frequência real de uma semana (workDate = segunda-feira). Parte de quem está na lista de chamada:
 * quem confirmou um abate entra como presente nele até ser marcado como falta.
 * A presença é separada por abate: pode faltar no frango e ir no boi.
 */
export function useAttendanceDay(workDate: string | null) {
    const [semana, setSemana] = useState<SemanaAbates>({ frango: false, boi: false });
    const [savedRows, setSavedRows] = useState<AttendanceRow[]>([]);
    const [draft, setDraft] = useState<Record<string, AttendanceEntry>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        // Sem data ainda (aguardando a lista mais recente): não carrega nada.
        if (!workDate) return;
        setLoading(true);
        const [pessoas, dia] = await Promise.all([
            supabase
                .from('ESTOQUE_employee_attendance')
                .select('id, employee_id, confirmed, frango, boi, received_chicken, present_frango, present_boi')
                .eq('work_date', workDate),
            supabase.from('ESTOQUE_abate_day').select('frango, boi').eq('work_date', workDate).maybeSingle(),
        ]);

        const erro = pessoas.error?.message ?? dia.error?.message ?? null;
        if (erro) {
            setError(erro);
        } else {
            const rows = (pessoas.data ?? []) as AttendanceRow[];
            const registro = dia.data as SemanaAbates | null;
            setError(null);
            setSemana(registro ? { frango: registro.frango, boi: registro.boi } : { frango: false, boi: false });
            setSavedRows(rows);
            setDraft(Object.fromEntries(rows.map((row) => [
                row.employee_id,
                {
                    confirmed: row.confirmed,
                    frango: row.frango,
                    boi: row.boi,
                    receivedChicken: row.received_chicken,
                    presentFrango: row.present_frango,
                    presentBoi: row.present_boi,
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

    // Presença em um abate. Quem está nesse abate na lista é presumido presente até ser marcado.
    // Sem o abate na lista, não há presença nele (null).
    const presentOf = (employeeId: string, kind: AbateKind): boolean | null => {
        const entry = entryOf(employeeId);
        if (!entry[kind]) return null;
        return entry[CAMPO_PRESENTE[kind]] ?? true;
    };

    // Clicar no status que já está marcado limpa a marcação.
    const setPresent = (employeeId: string, kind: AbateKind, present: boolean) => {
        setDraft((prev) => {
            const current = prev[employeeId] ?? EMPTY;
            const campo = CAMPO_PRESENTE[kind];
            const next = current[campo] === present ? null : present;
            // Quem faltou no frango não recebe frango.
            const receivedChicken = kind === 'frango' && next === false ? false : current.receivedChicken;
            return { ...prev, [employeeId]: { ...current, [campo]: next, receivedChicken } };
        });
    };

    const setReceivedChicken = (employeeId: string, value: boolean) => {
        setDraft((prev) => {
            const current = prev[employeeId] ?? EMPTY;
            return { ...prev, [employeeId]: { ...current, receivedChicken: value } };
        });
    };

    // Grava a presença real. Quem está na lista em um abate e não foi marcado como falta vira presente nele.
    // A lista de chamada não é alterada aqui.
    const save = async (): Promise<string | null> => {
        if (!workDate) return 'Data ainda não carregada';
        setSaving(true);

        const resolve = (employeeId: string): AttendanceEntry => {
            const entry = entryOf(employeeId);
            if (!entry.confirmed) return entry;
            return {
                ...entry,
                presentFrango: entry.frango ? (entry.presentFrango ?? true) : entry.presentFrango,
                presentBoi: entry.boi ? (entry.presentBoi ?? true) : entry.presentBoi,
            };
        };

        const upserts = Object.keys(draft)
            .map((employeeId) => ({ employeeId, entry: resolve(employeeId) }))
            .filter(({ entry }) => !isEmpty(entry))
            .map(({ employeeId, entry }) => ({
                employee_id: employeeId,
                work_date: workDate,
                confirmed: entry.confirmed,
                frango: entry.frango,
                boi: entry.boi,
                received_chicken: entry.receivedChicken,
                present_frango: entry.presentFrango,
                present_boi: entry.presentBoi,
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

    return { semana, loading, saving, error, entryOf, presentOf, setPresent, setReceivedChicken, save };
}

export type AttendanceHistoryRow = Pick<
    IAttendance,
    'work_date' | 'confirmed' | 'frango' | 'boi' | 'received_chicken' | 'present_frango' | 'present_boi'
>;

/** Todas as semanas de um funcionário, da mais recente para a mais antiga. */
export function useEmployeeAttendance(employeeId: string | null) {
    const [rows, setRows] = useState<AttendanceHistoryRow[]>([]);
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
                .select('work_date, confirmed, frango, boi, received_chicken, present_frango, present_boi')
                .eq('employee_id', employeeId)
                .order('work_date', { ascending: false });

            if (cancelled) return;
            if (error) {
                setError(error.message);
            } else {
                setError(null);
                setRows((data ?? []) as AttendanceHistoryRow[]);
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
  frango: boolean;
  boi: boolean;
  present_frango: boolean | null;
  present_boi: boolean | null;
}

/** Segunda-feira (YYYY-MM-DD) da semana mais recente já gravada. Null se não houver nenhuma ou a consulta falhar. */
export async function fetchUltimaData(): Promise<string | null> {
    const { data, error } = await supabase
        .from('ESTOQUE_employee_attendance')
        .select('work_date')
        .order('work_date', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) return null;
    return (data[0] as { work_date: string }).work_date;
}

/** Lista de chamada e presença de uma semana (segunda a domingo). Null se a consulta falhar. */
export async function fetchAttendanceWeek(weekStart: string): Promise<AttendanceWeekRow[] | null> {
    const { data, error } = await supabase
        .from('ESTOQUE_employee_attendance')
        .select('employee_id, work_date, confirmed, frango, boi, present_frango, present_boi')
        .gte('work_date', weekStart)
        .lte('work_date', addDays(weekStart, 6));

    if (error) return null;
    return (data ?? []) as AttendanceWeekRow[];
}
