import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/api/supabase';

export type AbateKind = 'frango' | 'boi';
export interface AbateKinds {
    frango: boolean;
    boi: boolean;
}

const NONE: AbateKinds = { frango: false, boi: false };

/**
 * Lista de chamada de um dia. Cada pessoa entra marcando em quais abates vai
 * (frango, boi ou os dois). Cada ação grava direto no banco.
 */
export function useConfirmationList(workDate: string) {
    const [entries, setEntries] = useState<Record<string, AbateKinds>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Busca os dados sem mexer em `loading`, para as ações não piscarem a tela.
    const fetchAll = useCallback(async (): Promise<string | null> => {
        const { data, error } = await supabase
            .from('ESTOQUE_employee_attendance')
            .select('employee_id, frango, boi')
            .eq('work_date', workDate)
            .eq('confirmed', true);

        if (error) {
            setError(error.message);
            return error.message;
        }

        const rows = (data ?? []) as { employee_id: string; frango: boolean; boi: boolean }[];
        setError(null);
        setEntries(Object.fromEntries(rows.map((row) => [row.employee_id, { frango: row.frango, boi: row.boi }])));
        return null;
    }, [workDate]);

    const load = useCallback(async () => {
        setLoading(true);
        await fetchAll();
        setLoading(false);
    }, [fetchAll]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void load();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [load]);

    const kindsOf = (employeeId: string): AbateKinds => entries[employeeId] ?? NONE;

    // Grava os abates de uma pessoa. Sem nenhum abate, a pessoa sai da lista.
    const writeKinds = async (employeeId: string, next: AbateKinds): Promise<string | null> => {
        if (next.frango || next.boi) {
            const { error: upsertError } = await supabase
                .from('ESTOQUE_employee_attendance')
                .upsert(
                    { employee_id: employeeId, work_date: workDate, confirmed: true, frango: next.frango, boi: next.boi },
                    { onConflict: 'employee_id,work_date' },
                );
            return upsertError?.message ?? null;
        }

        const { error: updateError } = await supabase
            .from('ESTOQUE_employee_attendance')
            .update({ confirmed: false, frango: false, boi: false })
            .eq('employee_id', employeeId)
            .eq('work_date', workDate);
        if (updateError) return updateError.message;

        // Sem lançamento de presença, a linha não tem mais informação: apaga.
        const { error: deleteError } = await supabase
            .from('ESTOQUE_employee_attendance')
            .delete()
            .eq('employee_id', employeeId)
            .eq('work_date', workDate)
            .eq('confirmed', false)
            .is('present', null);
        return deleteError?.message ?? null;
    };

    // Executa uma gravação, atualiza os dados e mostra o erro, se houver.
    const commit = async (write: () => Promise<string | null>): Promise<string | null> => {
        setSaving(true);
        const writeError = await write();
        if (writeError) {
            setError(writeError);
            setSaving(false);
            return writeError;
        }
        await fetchAll();
        setSaving(false);
        return null;
    };

    const addEmployee = (employeeId: string, kinds: AbateKinds): Promise<string | null> => {
        if (!kinds.frango && !kinds.boi) return Promise.resolve('Escolha pelo menos um abate.');
        return commit(() => writeKinds(employeeId, kinds));
    };

    const setPersonKind = (employeeId: string, kind: AbateKind, value: boolean): Promise<string | null> =>
        commit(() => writeKinds(employeeId, { ...kindsOf(employeeId), [kind]: value }));

    const removeEmployee = (employeeId: string): Promise<string | null> =>
        commit(() => writeKinds(employeeId, NONE));

    // Tira todo mundo da lista do dia. Lançamentos de presença (frequência) são mantidos.
    const clearList = (): Promise<string | null> =>
        commit(async () => {
            const { error: updateError } = await supabase
                .from('ESTOQUE_employee_attendance')
                .update({ confirmed: false, frango: false, boi: false })
                .eq('work_date', workDate);
            if (updateError) return updateError.message;

            const { error: deleteError } = await supabase
                .from('ESTOQUE_employee_attendance')
                .delete()
                .eq('work_date', workDate)
                .eq('confirmed', false)
                .is('present', null);
            return deleteError?.message ?? null;
        });

    return {
        loading,
        saving,
        error,
        confirmedIds: Object.keys(entries),
        kindsOf,
        addEmployee,
        setPersonKind,
        removeEmployee,
        clearList,
    };
}
