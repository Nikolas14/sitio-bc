import { useState, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { IProduct } from '@/types';
import { buildAdjustmentLines, roundKg, IAdjustmentLine } from '@/utils/stockCount';

interface ApplyResult {
  success: boolean;
  entradas: number;
  saidas: number;
  error?: string;
}

async function insertAdjustment(direction: 'IN' | 'OUT', lines: IAdjustmentLine[], reference: string) {
  const totalKg = roundKg(lines.reduce((acc, l) => acc + Math.abs(l.diffKg), 0));
  const totalPrice = lines.reduce((acc, l) => acc + Math.abs(l.diffKg) * l.price, 0);

  const { data: trans, error: transError } = await supabase
    .from('ESTOQUE_transaction')
    .insert([{
      type: direction,
      customer_vendor: reference,
      total_price: totalPrice,
      total_kg: totalKg,
      discount_percent: 0,
      status: 'AJUSTE'
    }])
    .select()
    .single();

  if (transError) throw transError;

  const operations = lines.map((l) => ({
    transaction_id: trans.id,
    product_id: l.productId,
    type: direction,
    quant: Math.abs(l.diffKg),
    unit_price: l.price
  }));

  const { error: opError } = await supabase.from('ESTOQUE_operation').insert(operations);

  if (opError) {
    await supabase.from('ESTOQUE_transaction').delete().eq('id', trans.id);
    throw opError;
  }
}

export function useStockAdjustment() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recalcula com o saldo do momento (vendas feitas durante a contagem entram na conta)
  // e lança uma transação AJUSTE de entrada e outra de saída.
  const applyAdjustment = useCallback(async (countedByProduct: Record<number, number>): Promise<ApplyResult> => {
    setSaving(true);
    setError(null);
    let entradasGravadas = false;

    try {
      const { data, error: viewError } = await supabase
        .from('ESTOQUE_v_inventory_summary')
        .select('*');

      if (viewError) throw viewError;

      const lines = buildAdjustmentLines((data as IProduct[]) || [], countedByProduct);
      const entradas = lines.filter((l) => l.diffKg > 0);
      const saidas = lines.filter((l) => l.diffKg < 0);
      const reference = `CONFERÊNCIA ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;

      if (entradas.length > 0) {
        await insertAdjustment('IN', entradas, reference);
        entradasGravadas = true;
      }
      if (saidas.length > 0) {
        await insertAdjustment('OUT', saidas, reference);
      }

      return { success: true, entradas: entradas.length, saidas: saidas.length };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);
      const message = entradasGravadas
        ? `Entradas gravadas, saídas falharam (aplicar de novo lança só o que falta): ${raw}`
        : raw;
      setError(message);
      return { success: false, entradas: 0, saidas: 0, error: message };
    } finally {
      setSaving(false);
    }
  }, []);

  return { applyAdjustment, saving, error };
}
