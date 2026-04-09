'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/api/supabase';
import * as htmlToImage from 'html-to-image';

import { ControlPanel } from '../components/ControlPanel/ControlPanel';
import { ITransaction } from '@/types';

import styles from './page.module.css';
import { useCobrancaDetalhes } from '@/hooks/useCobrancaDetalhes';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import { ReceiptCard } from '../components/ReceiptCard/ReceiptCard';
import { StatusStepper } from '../components/StatusStepper/StatusStepper';

export default function CobrancaDetalhadaPage() {
  const { id } = useParams();
  const cardRef = useRef<HTMLDivElement>(null);

  // O hook agora aceita o id que pode ser undefined
  const { trans, items, loading, error, setTrans } = useCobrancaDetalhes(id as string);

  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);
  const [newPayment, setNewPayment] = useState(0);

  // Sincroniza estados locais com o banco
  useEffect(() => {
    if (trans) {
      setShipping(Number(trans.shipping_cost) || 0);
      setTax(Number(trans.tax_amount) || 0);
    }
  }, [trans]);

  const financial = useMemo(() => {
    if (!trans || !items) return { sub: 0, discountValue: 0, final: 0, paid: 0, remaining: 0 };

    // 1. Calculamos o Bruto Real somando os itens (Preço * Quantidade)
    const sub = items.reduce((acc, item) => {
      return acc + (Number(item.quant) * Number(item.ESTOQUE_product?.price || 0));
    }, 0);

    // 2. Calculamos quanto o desconto representa em Reais
    const discountValue = sub * (Number(trans.discount_percent || 0) / 100);

    // 3. Valor Final = (Bruto - Desconto) + Taxas + Frete
    const final = (sub - discountValue) + Number(tax) + Number(shipping);

    const paid = Number(trans.paid_amount || 0);

    return {
      sub,
      discountValue,
      final,
      paid,
      remaining: Math.max(0, final - paid)
    };
  }, [trans, items, tax, shipping]);

  // Tipagem rigorosa para o status (evita o erro de string genérica)
  const updateStatus = async (newStatus: ITransaction['status']) => {
    const { error: upError } = await supabase
      .from('ESTOQUE_transaction')
      .update({ status: newStatus, shipping_cost: shipping, tax_amount: tax })
      .eq('id', id);

    if (!upError && trans) {
      setTrans({ ...trans, status: newStatus, shipping_cost: shipping, tax_amount: tax });
    }
  };

  const registrarPagamento = async () => {
    if (newPayment <= 0 || !trans) return;
    const totalPago = (Number(trans.paid_amount) || 0) + newPayment;

    // Lógica para definir se conclui ou apenas atualiza
    const status: ITransaction['status'] = totalPago >= financial.final ? 'CONCLUIDO' : 'COBRADO';

    const { error: payError } = await supabase
      .from('ESTOQUE_transaction')
      .update({ paid_amount: totalPago, status })
      .eq('id', id);

    if (!payError) {
      setTrans({ ...trans, paid_amount: totalPago, status });
      setNewPayment(0);
    }
  };

  const gerarImagem = async () => {
    if (!cardRef.current || !trans) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `RECIBO-${trans.customer_vendor}-${trans.serial_number}.png`.toUpperCase();
      link.href = dataUrl;
      link.click();

      if (trans.status === 'ENVIADO') await updateStatus('COBRADO');
    } catch (e) {
      console.error("Erro ao gerar imagem:", e);
    }
  };

  if (loading) return <div className={styles.centerInfo}>Sincronizando com o banco...</div>;
  if (error || !trans) return <div className={styles.centerInfo}>Transação não encontrada ou erro no banco.</div>;

  return (
    <div className={styles.screen}>
      <aside className={styles.sidebar}>
        <HeaderPadrao titulo={'Detalhes da Cobrança'} />

        <StatusStepper currentStatus={trans.status} />

        <ControlPanel
          trans={trans}
          shipping={shipping} setShipping={setShipping}
          tax={tax} setTax={setTax}
          isEditable={trans.status === 'PENDENTE' || trans.status === 'ENVIADO'}
          onUpdateStatus={updateStatus}
          onGerarImagem={gerarImagem}
          onRegistrarPagamento={registrarPagamento}
          setNewPayment={setNewPayment}
        />

      </aside>

      <main className={styles.previewArea}>
        <div className={styles.zoomWrapper}>
          <ReceiptCard
            ref={cardRef}
            trans={trans}
            items={items}
            shipping={shipping}
            tax={tax}
            financial={financial}
          />
        </div>
      </main>
    </div>
  );
}