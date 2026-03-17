'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './page.module.css';
import { supabase } from '@/api/supabase';

export default function FaturamentoPage() {
  const router = useRouter();
  const { id } = useParams();

  const [fatura, setFatura] = useState<any>(null);
  const [listaItens, setListaItens] = useState<any[]>([]);
  const [freight, setFreight] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // A taxa é fixa de 10% sobre o valor das mercadorias
  const TAX_RATE = 0.10;

  useEffect(() => {
    async function loadData() {
      const { data: fat } = await supabase.from('faturamento').select('*').eq('id', id).single();
      if (fat) {
        setFatura(fat);
        setFreight(fat.freight || 0);
        setDiscount(fat.discount || 0);
      }

      const { data: its } = await supabase.from('faturamento_itens').select('*').eq('faturamento_id', id);
      setListaItens(its || []);
    }
    loadData();
  }, [id]);

  // LÓGICA DE CÁLCULO CONFORME SUA EXPLICAÇÃO
  const calculos = useMemo(() => {
    if (!fatura) return { imposto: 0, desconto: 0, total: 0 };
    
    const subtotal = Number(fatura.priceTotal) || 0;
    const imposto = subtotal * TAX_RATE; // 10% sobre mercadorias
    const valorDesconto = subtotal * (Number(discount) / 100);
    const total = subtotal + imposto + Number(freight) - valorDesconto;

    return { imposto, valorDesconto, total };
  }, [fatura, freight, discount]);

  const handleUpdateStatus = async (novoStatus: 'COBRADO' | 'FINALIZADO') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('faturamento')
        .update({
          freight,
          tax: calculos.imposto, // Salva os 10% calculados
          discount,
          total_final: calculos.total,
          status: novoStatus
        })
        .eq('id', id);

      if (error) throw error;
      alert(`Status alterado para: ${novoStatus}`);
      
      if (novoStatus === 'FINALIZADO') {
        router.push('/'); // Volta para o início ao finalizar
      } else {
        // Se for apenas cobrado, recarrega os dados para mostrar o novo status
        window.location.reload();
      }
    } catch (err) {
      alert("Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  };

  if (!fatura) return <div className="p-10 text-center font-bold">Carregando Faturamento...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-3 rounded-lg text-center">
            <span className="block text-[10px] opacity-50">PEDIDO</span>
            <span className="text-xl font-black">#{fatura.serial_number}</span>
          </div>
          <div>
            <h1 className="text-xl font-black">{fatura.customer}</h1>
            <p className="text-xs font-bold text-blue-500">STATUS ATUAL: {fatura.status}</p>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-slate-400 uppercase">Peso Total</p>
           <p className="text-lg font-black text-slate-700">{fatura.total_kg?.toFixed(3)} KG</p>
        </div>
      </header>

      {/* Tabela de Itens (O que foi enviado) */}
      <div className="my-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase mb-2">Itens Enviados</h3>
        <div className="bg-slate-50 rounded-xl p-4">
          {listaItens.map(item => (
            <div key={item.id} className="flex justify-between text-sm py-1 border-b border-slate-200 last:border-0">
              <span>{item.product_name} ({item.quant}kg)</span>
              <span className="font-mono">R$ {item.price_total.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between mt-3 pt-3 border-t-2 border-slate-300 font-bold">
            <span>Subtotal Mercadorias</span>
            <span>R$ {fatura.priceTotal?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* INPUTS DE FATURAMENTO */}
      <section className={styles.gridInputs}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Frete (R$)</label>
          <input 
            type="number" 
            className={styles.input} 
            value={freight} 
            onChange={e => setFreight(Number(e.target.value))}
            disabled={fatura.status === 'FINALIZADO'}
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Imposto (10%)</label>
          <input 
            type="text" 
            className={styles.input} 
            value={`R$ ${calculos.imposto.toFixed(2)}`} 
            readOnly 
            style={{backgroundColor: '#f1f5f9'}}
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Desconto (%)</label>
          <input 
            type="number" 
            className={styles.input} 
            value={discount} 
            onChange={e => setDiscount(Number(e.target.value))}
            disabled={fatura.status === 'FINALIZADO'}
          />
        </div>
      </section>

      <div className={styles.totalCard}>
        <span className="text-slate-400 font-bold">VALOR TOTAL COBRADO:</span>
        <span className="text-3xl font-black text-blue-600">R$ {calculos.total.toFixed(2)}</span>
      </div>

      <div className={styles.actionArea}>
        <button className={styles.btnSecondary} onClick={() => router.push('/')}>Sair</button>
        
        {/* BOTÃO DINÂMICO CONFORME O STATUS */}
        {fatura.status === 'ENVIADO' || fatura.status === 'PENDENTE' ? (
          <button className={styles.btnPrimary} onClick={() => handleUpdateStatus('COBRADO')} disabled={loading}>
            Gerar Cobrança (Status: Cobrado)
          </button>
        ) : fatura.status === 'COBRADO' ? (
          <button className={styles.btnPrimary} style={{backgroundColor: '#22c55e'}} onClick={() => handleUpdateStatus('FINALIZADO')} disabled={loading}>
            Confirmar Pagamento (Status: Finalizado)
          </button>
        ) : (
          <span className="text-green-600 font-black">✓ PEDIDO FINALIZADO</span>
        )}
      </div>
    </div>
  );
}