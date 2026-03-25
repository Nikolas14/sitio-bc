'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/api/supabase';
import styles from './page.module.css';

export default function CobrancaDetalhadaPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [trans, setTrans] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);
  const [newPayment, setNewPayment] = useState(0); // Campo para novo valor pago
  const [loading, setLoading] = useState(true);

  const isEditable = trans?.status === 'PENDENTE';
  const isCobrancaAtiva = trans?.status === 'COBRADO' || trans?.status === 'ENVIADO';

  useEffect(() => {
    async function loadAllData() {
      const { data: tData } = await supabase.from('ESTOQUE_transaction').select('*').eq('id', id).single();
      const { data: iData } = await supabase.from('ESTOQUE_operation').select('quant, ESTOQUE_product(name, price)').eq('transaction_id', id);

      if (tData) {
        setTrans(tData);
        setShipping(Number(tData.shipping_cost) || 0);
        setTax(Number(tData.tax_amount) || 0);
      }
      setItems(iData || []);
      setLoading(false);
    }
    loadAllData();
  }, [id]);

  const totals = useMemo(() => {
    if (!trans) return null;
    const subtotal = Number(trans.total_price);
    const desc = subtotal * (Number(trans.discount_percent) / 100);
    const final = (subtotal - desc) + Number(tax) + Number(shipping);
    const paid = Number(trans.paid_amount) || 0;
    const remaining = final - paid;

    return { subtotal, desc, final, paid, remaining };
  }, [trans, tax, shipping]);

const registrarPagamento = async () => {
  // 1. Validação básica: não aceita valores zerados ou negativos
  if (newPayment <= 0) {
    alert("Insira um valor válido para o pagamento.");
    return;
  }

  // 2. Cálculo do novo acumulado
  const novoTotalPago = totals!.paid + newPayment;
  
  // 3. REGRA DE STATUS:
  // Só vira 'CONCLUIDO' se o valor pago for IGUAL ou MAIOR que o total final.
  // Caso contrário, permanece como 'COBRADO'.
  const novoStatus = novoTotalPago >= totals!.final ? 'CONCLUIDO' : 'COBRADO';

  const { error } = await supabase
    .from('ESTOQUE_transaction')
    .update({ 
      paid_amount: novoTotalPago,
      status: novoStatus 
    })
    .eq('id', id);

  if (error) {
    alert("Erro ao registrar pagamento: " + error.message);
  } else {
    // Atualiza o estado local para refletir a mudança na tela na hora
    setTrans({ ...trans, paid_amount: novoTotalPago, status: novoStatus });
    setNewPayment(0); // Limpa o campo de input

    // Feedback para o operador
    if (novoStatus === 'CONCLUIDO') {
      alert("PAGAMENTO TOTAL RECEBIDO! A venda foi marcada como CONCLUÍDA.");
      router.push('/cobranca'); // Opcional: volta para a lista após concluir
    } else {
      const falta = totals!.final - novoTotalPago;
      alert(`Pagamento parcial de R$ ${newPayment.toFixed(2)} registrado. O status continua como COBRADO pois ainda faltam R$ ${falta.toFixed(2)}.`);
    }
  }
};

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase.from('ESTOQUE_transaction')
      .update({ status: newStatus, shipping_cost: shipping, tax_amount: tax }).eq('id', id);
    if (!error) setTrans({ ...trans, status: newStatus });
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">CARREGANDO...</div>;

  return (
    <div className={styles.container}>
      {/* PAINEL DE CONTROLE */}
      <aside className={styles.leftPanel}>
        <header>
          <button onClick={() => router.back()} className="text-[10px] font-black text-slate-400 mb-2 uppercase">← Voltar</button>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">Painel de Carga</h1>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">{trans.status}</span>
        </header>

        {/* TRAVA DE FRETE/IMPOSTO */}
        <div className={isEditable ? "" : "opacity-50 pointer-events-none"}>
          <label className="text-[10px] font-black text-slate-400 uppercase">Frete</label>
          <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold mb-4" value={shipping} onChange={(e) => setShipping(Number(e.target.value))} disabled={!isEditable} />
          
          <label className="text-[10px] font-black text-slate-400 uppercase">Imposto</label>
          <div className="flex gap-2">
            <input type="number" className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold" value={tax} onChange={(e) => setTax(Number(e.target.value))} disabled={!isEditable} />
            <button onClick={() => isEditable && setTax(Number(trans.total_price) * 0.10)} className="bg-slate-800 text-white px-3 rounded-xl text-[9px] font-black uppercase">10%</button>
          </div>
        </div>

        {/* REGISTRO DE PAGAMENTO PARCIAL */}
        {isCobrancaAtiva && (
          <div className={styles.paidInputGroup}>
            <label className="text-[10px] font-black text-green-700 uppercase">Registrar Novo Pagamento</label>
            <div className="flex gap-2 mt-1">
              <input 
                type="number" 
                className="flex-1 p-3 border-2 border-green-200 rounded-xl font-black text-green-700" 
                placeholder="R$ 0,00"
                value={newPayment}
                onChange={(e) => setNewPayment(Number(e.target.value))}
              />
              <button onClick={registrarPagamento} className="bg-green-600 text-white px-4 rounded-xl font-black text-[10px]">OK</button>
            </div>
            <p className={styles.paymentHistory}>Já recebido: R$ {totals?.paid.toFixed(2)}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-4">
          {isEditable && <button className={`${styles.btnAction} ${styles.btnSave}`} onClick={() => updateStatus('ENVIADO')}>Marcar como Enviado</button>}
          {trans.status === 'ENVIADO' && <button className={`${styles.btnAction} ${styles.btnSave}`} style={{background:'#0f172a'}} onClick={() => updateStatus('COBRADO')}>Liberar p/ Cobrança</button>}
          <button className={`${styles.btnAction} ${styles.btnCancel}`} onClick={() => updateStatus('CANCELADO')}>Cancelar</button>
        </div>
      </aside>

      {/* COMPROVANTE VISUAL */}
      <main>
        <div className={styles.shareCard}>
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-blue-400 font-black text-[10px] tracking-[0.3em] uppercase">Beit Stock • Resumo Atualizado</p>
              <h2 className="text-4xl font-black uppercase tracking-tighter">{trans?.customer_vendor}</h2>
            </div>
            <div className="text-right">
              <span className="bg-white/10 px-3 py-1 rounded-lg font-mono text-xs font-bold">Ref: #{trans?.serial_number}</span>
            </div>
          </div>

          <table className={styles.itemTable}>
            <thead><tr><th>Item</th><th className={styles.qtyCol}>Peso</th><th className={styles.priceCol}>Unit</th><th className={styles.priceCol}>Sub</th></tr></thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="font-bold uppercase text-[12px]">{item.ESTOQUE_product?.name}</td>
                  <td className={styles.qtyCol}>{Number(item.quant).toFixed(3)}</td>
                  <td className={styles.priceCol}>R$ {Number(item.ESTOQUE_product?.price).toFixed(2)}</td>
                  <td className={styles.priceCol}>R$ {(Number(item.quant) * Number(item.ESTOQUE_product?.price)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.totalSection}>
            <div className={styles.line}><span>Mercadoria:</span> <span className="font-bold text-white">R$ {totals?.subtotal.toFixed(2)}</span></div>
            <div className={styles.line}><span>Frete + Impostos:</span> <span className="font-bold text-white">+ R$ {(shipping + tax).toFixed(2)}</span></div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/10 pt-6">
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Total do Pedido</p>
                <p className="text-3xl font-black">R$ {totals?.final.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-green-400 uppercase mb-1">Valor Já Pago</p>
                <p className="text-3xl font-black text-green-400">R$ {totals?.paid.toFixed(2)}</p>
              </div>
            </div>

            {totals!.remaining > 0 && (
              <div className="mt-4 bg-red-500/20 p-4 rounded-2xl flex justify-between items-center border border-red-500/30">
                <span className="text-red-200 font-black uppercase text-[10px] tracking-widest">Saldo Devedor:</span>
                <span className="text-2xl font-black text-red-400">R$ {totals?.remaining.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}