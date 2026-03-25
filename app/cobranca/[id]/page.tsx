'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/api/supabase';
import * as htmlToImage from 'html-to-image';
import styles from './page.module.css';
import './receipt.css'; // Adicione esta linha
import { ControlPanel } from './ControlPanel';
import { ReceiptCard } from './ReceiptCard';

export default function CobrancaDetalhadaPage() {
  const { id } = useParams();
  const cardRef = useRef<HTMLDivElement>(null);

  const [trans, setTrans] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);
  const [newPayment, setNewPayment] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
    loadData();
  }, [id]);

  const financial = useMemo(() => {
    if (!trans) return { sub: 0, desc: 0, final: 0, paid: 0, remaining: 0 };
    const sub = Number(trans.total_price || 0);
    const desc = sub * (Number(trans.discount_percent || 0) / 100);
    const final = (sub - desc) + Number(tax) + Number(shipping);
    const paid = Number(trans.paid_amount || 0);
    return { sub, desc, final, paid, remaining: final - paid };
  }, [trans, tax, shipping]);

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase.from('ESTOQUE_transaction').update({ status: newStatus, shipping_cost: shipping, tax_amount: tax }).eq('id', id);
    if (!error) setTrans({ ...trans, status: newStatus });
  };

  const gerarImagem = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `RECIBO-${trans?.customer_vendor ?? 'CLIENTE'}.png`.toUpperCase();
      link.href = dataUrl;
      link.click();
      if (trans.status === 'ENVIADO') await updateStatus('COBRADO');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const registrarPagamento = async () => {
    if (newPayment <= 0) return;
    const totalPago = (Number(trans.paid_amount) || 0) + newPayment;
    const status = totalPago >= (financial?.final || 0) ? 'CONCLUIDO' : 'COBRADO';
    await supabase.from('ESTOQUE_transaction').update({ paid_amount: totalPago, status }).eq('id', id);
    window.location.reload();
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">CARREGANDO...</div>;

  return (
    <div className={styles.container}>
      <ControlPanel 
        trans={trans} shipping={shipping} setShipping={setShipping} tax={tax} setTax={setTax}
        isEditable={trans?.status === 'PENDENTE'}
        onUpdateStatus={updateStatus} onGerarImagem={gerarImagem} 
        onRegistrarPagamento={registrarPagamento} setNewPayment={setNewPayment}
      />
      <ReceiptCard ref={cardRef} trans={trans} items={items} shipping={shipping} tax={tax} financial={financial} />
    </div>
  );
}