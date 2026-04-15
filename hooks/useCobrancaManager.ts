'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import * as htmlToImage from 'html-to-image';
import { ITransaction } from '@/types';
import { useCobranca } from './useCobranca';

export function useCobrancaManager(id: string) {
  // Hook de busca de dados (Master-Detail)
  const { trans, items, loading, error, refresh } = useCobranca(id);

  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);
  const [newPayment, setNewPayment] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sincroniza valores do banco com o estado local ao carregar
  useEffect(() => {
    if (trans) {
      setShipping(Number(trans.shipping_cost) || 0);
      setTax(Number(trans.tax_amount) || 0);
    }
  }, [trans]);

  // Trava de segurança: impede edição se o status não for PENDENTE ou ENVIADO
  const isLocked = useMemo(() => {
    if (!trans) return true;
    return ['ENVIADO', 'COBRADO', 'CONCLUIDO'].includes(trans.status);
  }, [trans?.status]);

  // Cálculos financeiros centralizados
  const financial = useMemo(() => {
    if (!trans || !items) return { sub: 0, discountValue: 0, final: 0, paid: 0, remaining: 0 };

    const sub = items.reduce((acc, item) => {
      const price = Number(item.ESTOQUE_product?.price || 0);
      return acc + (Number(item.quant) * price);
    }, 0);

    const discountValue = sub * (Number(trans.discount_percent || 0) / 100);
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

  // Atualiza status e taxas (Força refresh para travar a tela se necessário)
  const updateStatus = async (newStatus: ITransaction['status']) => {
    setIsProcessing(true);
    const { error: upError } = await supabase
      .from('ESTOQUE_transaction')
      .update({ 
        status: newStatus, 
        shipping_cost: shipping, 
        tax_amount: tax 
      })
      .eq('id', id);

    if (!upError) await refresh();
    setIsProcessing(false);
  };

  const registrarPagamento = async () => {
    if (newPayment <= 0 || !trans) return;
    setIsProcessing(true);

    const totalPago = (Number(trans.paid_amount) || 0) + newPayment;
    const status = totalPago >= financial.final ? 'CONCLUIDO' : 'COBRADO';

    const { error: payError } = await supabase
      .from('ESTOQUE_transaction')
      .update({ paid_amount: totalPago, status })
      .eq('id', id);

    if (!payError) {
      setNewPayment(0);
      await refresh();
    }
    setIsProcessing(false);
  };

  // Geração de Imagem (Recebe o elemento HTML puro para evitar erro de RefObject)
  const gerarImagem = async (element: HTMLDivElement | null) => {
    if (!element || !trans) return;

    try {
      setIsProcessing(true);
      const dataUrl = await htmlToImage.toPng(element, { 
        backgroundColor: '#ffffff', 
        pixelRatio: 3 
      });
      
      const link = document.createElement('a');
      link.download = `RECIBO-${trans.customer_vendor}-${trans.serial_number || id.slice(0,5)}`.toUpperCase() + '.png';
      link.href = dataUrl;
      link.click();

      // Transição automática de status após gerar o recibo
      if (trans.status === 'ENVIADO') {
        await updateStatus('COBRADO');
      }
    } catch (e) {
      console.error("Erro ao gerar imagem:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    trans,
    items,
    loading: loading || isProcessing,
    error,
    financial,
    isLocked,
    shipping,
    setShipping,
    tax,
    setTax,
    newPayment,
    setNewPayment,
    updateStatus,
    registrarPagamento,
    gerarImagem
  };
}