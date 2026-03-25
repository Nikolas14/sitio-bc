'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/api/supabase';
import styles from './page.module.css';
import * as htmlToImage from 'html-to-image'; // Importação da lib

export default function CobrancaDetalhadaPage() {
  const { id } = useParams();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null); // Referência para o card
  
  const [trans, setTrans] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);
  const [newPayment, setNewPayment] = useState(0);
  const [loading, setLoading] = useState(true);

  const isEditable = trans?.status === 'PENDENTE';

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

  // FUNÇÃO MÁGICA: Transforma o HTML em Imagem
  const gerarImagem = async () => {
    if (cardRef.current === null) return;
    
    try {
      setLoading(true);
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#0f172a', // Cor de fundo do card
        pixelRatio: 2, // Dobra a qualidade da imagem
      });
      
      const link = document.createElement('a');
      link.download = `BEIT-STOCK-${trans.customer_vendor}-${trans.serial_number}.png`;
      link.href = dataUrl;
      link.click();
      
      // Se for a primeira vez gerando, muda status para COBRADO
      if (trans.status === 'ENVIADO') {
        updateStatus('COBRADO');
      }
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
    } finally {
      setLoading(false);
    }
  };

  const registrarPagamento = async () => {
    const novoTotalPago = totals!.paid + newPayment;
    const novoStatus = novoTotalPago >= totals!.final ? 'CONCLUIDO' : 'COBRADO';
    const { error } = await supabase.from('ESTOQUE_transaction').update({ paid_amount: novoTotalPago, status: novoStatus }).eq('id', id);
    if (!error) {
      setTrans({ ...trans, paid_amount: novoTotalPago, status: novoStatus });
      setNewPayment(0);
    }
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase.from('ESTOQUE_transaction').update({ status: newStatus, shipping_cost: shipping, tax_amount: tax }).eq('id', id);
    if (!error) setTrans({ ...trans, status: newStatus });
  };

  if (loading) return <div className="p-20 text-center font-black">CARREGANDO...</div>;

  return (
    <div className={styles.container}>
      <aside className={styles.leftPanel}>
        <header>
          <button onClick={() => router.back()} className="text-[10px] font-black text-slate-400 mb-2 uppercase">← Voltar</button>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">Painel Financeiro</h1>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">{trans.status}</span>
        </header>

        <div className={isEditable ? "" : "opacity-50 pointer-events-none"}>
          <label className="text-[10px] font-black text-slate-400 uppercase">Frete</label>
          <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold mb-4" value={shipping} onChange={(e) => setShipping(Number(e.target.value))} />
          
          <label className="text-[10px] font-black text-slate-400 uppercase">Imposto</label>
          <div className="flex gap-2">
            <input type="number" className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
            <button onClick={() => setTax(Number(trans.total_price) * 0.10)} className="bg-slate-800 text-white px-3 rounded-xl text-[9px] font-black uppercase">10%</button>
          </div>
        </div>

        {/* Botão para Gerar a Imagem */}
        <button className={styles.downloadBtn} onClick={gerarImagem}>
          🖼️ GERAR IMAGEM WHATSAPP
        </button>

        {trans.status === 'COBRADO' && (
          <div className="bg-green-50 p-4 rounded-xl mt-4 border border-green-100">
            <label className="text-[10px] font-black text-green-700 uppercase">Receber Valor</label>
            <div className="flex gap-2 mt-1">
              <input type="number" className="flex-1 p-2 border rounded-lg font-black" value={newPayment} onChange={(e) => setNewPayment(Number(e.target.value))} />
              <button onClick={registrarPagamento} className="bg-green-600 text-white px-3 rounded-lg font-black text-xs">OK</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-auto">
          {isEditable && <button className={styles.btnAction} style={{background: '#3b82f6', color: 'white'}} onClick={() => updateStatus('ENVIADO')}>Finalizar Custos (ENVIAR)</button>}
          <button className={styles.btnCancel} onClick={() => updateStatus('CANCELADO')}>Cancelar Venda</button>
        </div>
      </aside>

      <main>
        {/* Este é o card que será capturado pela função gerarImagem */}
        <div ref={cardRef} className={styles.shareCard}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-blue-400 font-black text-[10px] tracking-[0.3em] uppercase mb-1">Beit Stock • Comprovante</p>
              <h2 className="text-3xl font-black uppercase tracking-tighter">{trans?.customer_vendor}</h2>
              <p className="text-[10px] opacity-40 font-bold">{new Date(trans?.created_at).toLocaleString()}</p>
            </div>
            <span className="bg-white/10 px-3 py-1 rounded-lg font-mono text-xs font-bold"># {trans?.serial_number}</span>
          </div>

          <table className={styles.itemTable}>
            <thead>
              <tr>
                <th>Descrição</th>
                <th className={styles.qtyCol}>Peso</th>
                <th className={styles.priceCol}>Unit.</th>
                <th className={styles.priceCol}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="font-bold uppercase text-[11px]">{item.ESTOQUE_product?.name}</td>
                  <td className={styles.qtyCol}>{Number(item.quant).toFixed(3)}</td>
                  <td className={styles.priceCol}>R$ {Number(item.ESTOQUE_product?.price).toFixed(2)}</td>
                  <td className={styles.priceCol}>R$ {(Number(item.quant) * Number(item.ESTOQUE_product?.price)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.totalSection}>
            <div className={styles.line}><span>Subtotal Produtos:</span> <span>R$ {totals?.subtotal.toFixed(2)}</span></div>
            {totals!.desc > 0 && <div className={styles.line}><span className="text-red-400">Desconto:</span> <span>- R$ {totals?.desc.toFixed(2)}</span></div>}
            <div className={styles.line}><span>Frete:</span> <span>+ R$ {shipping.toFixed(2)}</span></div>
            <div className={styles.line}><span>Impostos:</span> <span>+ R$ {tax.toFixed(2)}</span></div>
            
            <div className="mt-6 border-t border-white/10 pt-6">
               <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase">Total a Pagar</p>
                    <p className="text-4xl font-black">R$ {totals?.final.toFixed(2)}</p>
                  </div>
                  {totals!.paid > 0 && (
                    <div className="text-right">
                      <p className="text-[9px] font-black text-green-400 uppercase">Já Pago</p>
                      <p className="text-xl font-black text-green-400">R$ {totals?.paid.toFixed(2)}</p>
                    </div>
                  )}
               </div>

               {totals!.remaining > 0 && totals!.paid > 0 && (
                 <div className="mt-4 bg-red-500/20 p-3 rounded-xl flex justify-between items-center border border-red-500/30">
                   <span className="text-red-200 font-black uppercase text-[9px]">Saldo Devedor:</span>
                   <span className="text-xl font-black text-red-400">R$ {totals?.remaining.toFixed(2)}</span>
                 </div>
               )}
            </div>
            
            <p className="text-center text-[8px] font-black opacity-20 uppercase tracking-[0.5em] mt-8">Obrigado pela preferência</p>
          </div>
        </div>
      </main>
    </div>
  );
}