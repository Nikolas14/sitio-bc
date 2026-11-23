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

const emptyForm: BoletoFormData = {
    numero: '',
    empresa: '',
    vencimento: '',
    valor: '',
    banco: '',
};

// Código do Postgres para violação de chave única (número de boleto repetido).
const CODIGO_DUPLICADO = '23505';

export function useBoletoManager() {
    const [boletos, setBoletos] = useState<IBoleto[]>([]);
    const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
    const [formData, setFormData] = useState<BoletoFormData>(emptyForm);
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

    const handleSelect = (boleto: IBoleto | 'new') => {
        if (boleto === 'new') {
            setSelectedId('new');
            setFormData({ ...emptyForm });
            return;
        }

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

    const saveBoleto = async (): Promise<string | null> => {
        const erroValidacao = validarFormulario(formData);
        if (erroValidacao) return erroValidacao;

        const valor = parseValor(formData.valor);
        if (valor === null) return 'Valor inválido.';

        setLoading(true);

        const payload = {
            numero: formData.numero.trim().toUpperCase(),
            empresa: formData.empresa.trim().toUpperCase(),
            vencimento: formData.vencimento,
            valor,
            updated_at: new Date().toISOString(),
        };

        // Pagamento (paid_at e banco) não muda aqui: só marcar/desfazer pagamento altera esses campos.
        const result = selectedId === 'new'
            ? await supabase.from('ESTOQUE_boleto').insert(payload)
            : await supabase.from('ESTOQUE_boleto').update(payload).eq('id', selectedId);

        return finishWrite(result.error, 'Já existe um boleto com esse número.', true);
    };

    const deleteBoleto = async (): Promise<string | null> => {
        if (!selectedId || selectedId === 'new') return 'Nenhum boleto selecionado.';

        setLoading(true);
        const { error } = await supabase.from('ESTOQUE_boleto').delete().eq('id', selectedId);
        return finishWrite(error, '', true);
    };

    const markPaid = async (banco: string): Promise<string | null> => {
        if (!selectedId || selectedId === 'new') return 'Nenhum boleto selecionado.';
        if (!banco.trim()) return 'Escolha o banco do pagamento.';

        setLoading(true);
        const { error } = await supabase
            .from('ESTOQUE_boleto')
            .update({ paid_at: new Date().toISOString(), banco: banco.trim().toUpperCase() })
            .eq('id', selectedId);
        return finishWrite(error, '', false);
    };

    const undoPaid = async (): Promise<string | null> => {
        if (!selectedId || selectedId === 'new') return 'Nenhum boleto selecionado.';

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
        saveBoleto,
        deleteBoleto,
        markPaid,
        undoPaid,
    };
}
