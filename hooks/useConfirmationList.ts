import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/api/supabase';

export type AbateKind = 'frango' | 'boi';
export interface AbateKinds {
    frango: boolean;
    boi: boolean;
}

const NONE: AbateKinds = { frango: false, boi: false };
// Semana nova: tem frango e boi, como antes.
const PADRAO_SEMANA: AbateKinds = { frango: true, boi: true };

/**
 * Lista de chamada de uma semana (workDate = segunda-feira). Cada pessoa entra marcando em quais
 * abates vai (frango, boi ou os dois). A semana registra se tem frango e se tem boi.
 * Cada ação grava direto no banco.
 */
export function useConfirmationList(workDate: string | null) {
    const [entries, setEntries] = useState<Record<string, AbateKinds>>({});
    const [semana, setSemana] = useState<AbateKinds | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Busca os dados sem mexer em `loading`, para as ações não piscarem a tela.
    const fetchAll = useCallback(async (): Promise<string | null> => {
        // Sem data ainda (aguardando a lista mais recente): não busca nada.
        if (!workDate) return null;
        const [pessoas, dia] = await Promise.all([
            supabase
                .from('ESTOQUE_employee_attendance')
                .select('employee_id, frango, boi')
                .eq('work_date', workDate)
                .eq('confirmed', true),
            supabase.from('ESTOQUE_abate_day').select('frango, boi').eq('work_date', workDate).maybeSingle(),
        ]);

        const erro = pessoas.error?.message ?? dia.error?.message ?? null;
        if (erro) {
            setError(erro);
            return erro;
        }

        const rows = (pessoas.data ?? []) as { employee_id: string; frango: boolean; boi: boolean }[];
        setError(null);
        setEntries(Object.fromEntries(rows.map((row) => [row.employee_id, { frango: row.frango, boi: row.boi }])));
        const registro = dia.data as AbateKinds | null;
        setSemana(registro ? { frango: registro.frango, boi: registro.boi } : PADRAO_SEMANA);
        return null;
    }, [workDate]);

    const load = useCallback(async () => {
        if (!workDate) return;
        setLoading(true);
        await fetchAll();
        setLoading(false);
    }, [workDate, fetchAll]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void load();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [load]);

    const kindsOf = (employeeId: string): AbateKinds => entries[employeeId] ?? NONE;

    // Grava o registro da semana (tem frango? tem boi?).
    const writeSemana = async (next: AbateKinds): Promise<string | null> => {
        const { error: upsertError } = await supabase
            .from('ESTOQUE_abate_day')
            .upsert({ work_date: workDate, frango: next.frango, boi: next.boi }, { onConflict: 'work_date' });
        return upsertError?.message ?? null;
    };

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
            .is('present_frango', null)
            .is('present_boi', null);
        return deleteError?.message ?? null;
    };

    // Executa uma gravação, atualiza os dados e mostra o erro, se houver.
    const commit = async (write: () => Promise<string | null>): Promise<string | null> => {
        if (!workDate) return 'Data ainda não carregada';
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

    // Ao primeiro lançamento da semana, o registro da semana também é gravado.
    const addEmployee = (employeeId: string, kinds: AbateKinds): Promise<string | null> => {
        if (!kinds.frango && !kinds.boi) return Promise.resolve('Escolha pelo menos um abate.');
        return commit(async () => {
            const registro = await writeSemana(semana ?? PADRAO_SEMANA);
            if (registro) return registro;
            return writeKinds(employeeId, kinds);
        });
    };

    const setPersonKind = (employeeId: string, kind: AbateKind, value: boolean): Promise<string | null> =>
        commit(() => writeKinds(employeeId, { ...kindsOf(employeeId), [kind]: value }));

    const removeEmployee = (employeeId: string): Promise<string | null> =>
        commit(() => writeKinds(employeeId, NONE));

    // Liga ou desliga o abate da semana (frango ou boi).
    const setSemanaKind = (kind: AbateKind, value: boolean): Promise<string | null> =>
        commit(() => writeSemana({ ...(semana ?? PADRAO_SEMANA), [kind]: value }));

    // Tira todo mundo da lista da semana. Lançamentos de presença (frequência) são mantidos.
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
                .is('present_frango', null)
                .is('present_boi', null);
            return deleteError?.message ?? null;
        });

    return {
        loading,
        saving,
        error,
        semana: semana ?? PADRAO_SEMANA,
        confirmedIds: Object.keys(entries),
        kindsOf,
        addEmployee,
        setPersonKind,
        removeEmployee,
        setSemanaKind,
        clearList,
    };
}
