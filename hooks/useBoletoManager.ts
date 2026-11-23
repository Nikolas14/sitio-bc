import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/api/supabase';
import { IBoleto } from '@/types';
import { parseValor, sugestoesEmpresa, validarFormulario } from '@/utils/boletos';

export interface BoletoFormData {
    numero: string;
    empresa: string;
    vencimento: string;
    valor: string;
    banco: string;
}

export const formVazio: BoletoFormData = {
    numero: '',
    empresa: '',
    vencimento: '',
    valor: '',
    banco: '',
};

// Código do Postgres para violação de chave única (número de boleto repetido).
const CODIGO_DUPLICADO = '23505';
const MENSAGEM_DUPLICADO = 'Já existe um boleto com esse número.';

export function useBoletoManager() {
    const [boletos, setBoletos] = useState<IBoleto[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState<BoletoFormData>(formVazio);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBoletos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ESTOQUE_boleto')
            .select('*')
            .order('vencimento', { ascending: true });

        if (error) {
            setError(error.message);
        } else {
            setError(null);
            setBoletos((data as IBoleto[]) ?? []);
        }
        setLoading(false);
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchBoletos();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, []);

    const handleSelect = (boleto: IBoleto) => {
        setSelectedId(boleto.id);
        setFormData({
            numero: boleto.numero ?? '',
            empresa: boleto.empresa ?? '',
            vencimento: boleto.vencimento ?? '',
            valor: boleto.valor != null ? boleto.valor.toFixed(2).replace('.', ',') : '',
            banco: boleto.banco ?? '',
        });
    };

    // fecharFicha: salvar e excluir fecham a ficha; marcar/desfazer pagamento deixa o boleto aberto.
    const finishWrite = async (
        writeError: { message: string; code?: string } | null,
        mensagemDuplicado: string,
        fecharFicha: boolean,
    ) => {
        if (writeError) {
            const message = writeError.code === CODIGO_DUPLICADO ? mensagemDuplicado : writeError.message;
            setError(message);
            setLoading(false);
            return message;
        }

        setError(null);
        await fetchBoletos();
        if (fecharFicha) setSelectedId(null);
        setLoading(false);
        return null;
    };

    // Valida e converte o formulário. Pagamento (paid_at e banco) nunca passa por aqui.
    const montarPayload = (form: BoletoFormData) => {
        const erroValidacao = validarFormulario(form);
        if (erroValidacao) return { erro: erroValidacao, payload: null };

        const valor = parseValor(form.valor);
        if (valor === null) return { erro: 'Valor inválido.', payload: null };

        return {
            erro: null,
            payload: {
                numero: form.numero.trim().toUpperCase(),
                empresa: form.empresa.trim().toUpperCase(),
                vencimento: form.vencimento,
                valor,
            },
        };
    };

    const createBoleto = async (form: BoletoFormData): Promise<string | null> => {
        const { erro, payload } = montarPayload(form);
        if (!payload) return erro;

        setLoading(true);
        const { error } = await supabase.from('ESTOQUE_boleto').insert(payload);
        return finishWrite(error, MENSAGEM_DUPLICADO, false);
    };

    const saveBoleto = async (): Promise<string | null> => {
        if (!selectedId) return 'Nenhum boleto selecionado.';

        const { erro, payload } = montarPayload(formData);
        if (!payload) return erro;

        setLoading(true);
        const { error } = await supabase
            .from('ESTOQUE_boleto')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', selectedId);
        return finishWrite(error, MENSAGEM_DUPLICADO, true);
    };

    const deleteBoleto = async (): Promise<string | null> => {
        if (!selectedId) return 'Nenhum boleto selecionado.';

        setLoading(true);
        const { error } = await supabase.from('ESTOQUE_boleto').delete().eq('id', selectedId);
        return finishWrite(error, '', true);
    };

    const markPaid = async (banco: string): Promise<string | null> => {
        if (!selectedId) return 'Nenhum boleto selecionado.';
        if (!banco.trim()) return 'Escolha o banco do pagamento.';

        setLoading(true);
        const { error } = await supabase
            .from('ESTOQUE_boleto')
            .update({ paid_at: new Date().toISOString(), banco: banco.trim().toUpperCase() })
            .eq('id', selectedId);
        return finishWrite(error, '', false);
    };

    const undoPaid = async (): Promise<string | null> => {
        if (!selectedId) return 'Nenhum boleto selecionado.';

        setLoading(true);
        const { error } = await supabase
            .from('ESTOQUE_boleto')
            .update({ paid_at: null, banco: '' })
            .eq('id', selectedId);
        return finishWrite(error, '', false);
    };

    // Em aberto primeiro, por vencimento (mais próximo primeiro); depois pagos, do pagamento mais recente.
    const filteredBoletos = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return boletos
            .filter((boleto) =>
                [boleto.numero, boleto.empresa].some((value) => value?.toLowerCase().includes(term)),
            )
            .sort((a, b) => {
                if (!a.paid_at && b.paid_at) return -1;
                if (a.paid_at && !b.paid_at) return 1;
                if (!a.paid_at && !b.paid_at) return a.vencimento.localeCompare(b.vencimento);
                return (b.paid_at ?? '').localeCompare(a.paid_at ?? '');
            });
    }, [boletos, searchTerm]);

    const empresasSugeridas = useMemo(() => sugestoesEmpresa(boletos), [boletos]);

    return {
        loading,
        error,
        boletos,
        searchTerm,
        setSearchTerm,
        filteredBoletos,
        empresasSugeridas,
        selectedId,
        setSelectedId,
        formData,
        setFormData,
        handleSelect,
        createBoleto,
        saveBoleto,
        deleteBoleto,
        markPaid,
        undoPaid,
    };
}
