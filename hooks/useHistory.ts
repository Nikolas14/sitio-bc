import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { IOperation } from '@/types';

// Datas no formato do <input type="date">: 'YYYY-MM-DD'. Vazio = sem limite
export interface DateRange {
  from: string;
  to: string;
}

// Data local (meia-noite) a partir de 'YYYY-MM-DD'
function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Formata uma data local como 'YYYY-MM-DD'
export function toInputDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// `start` é inclusivo; `end` é exclusivo (dia seguinte ao "até"), para o dia final entrar inteiro
export function getRangeWindow({ from, to }: DateRange): { start: Date | null; end: Date | null } {
  const start = from ? parseLocalDate(from) : null;

  let end: Date | null = null;
  if (to) {
    end = parseLocalDate(to);
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

export function useHistory(productId: number | null, range: DateRange) {
  const [history, setHistory] = useState<IOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { from, to } = range;

  const fetchHistory = useCallback(async () => {
    if (!productId) {
      await Promise.resolve();
      setHistory([]);
      return;
    }

    try {
      await Promise.resolve();
      setLoading(true);
      setError(null);

      let query = supabase
        .from('ESTOQUE_operation')
        .select(`
          id,
          type,
          quant,
          created_at,
          ESTOQUE_transaction (
            customer_vendor,
            serial_number
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      // Busca desde o início do intervalo até agora; o fim é aplicado na tela
      // para o saldo continuar ancorado no estoque atual
      const { start } = getRangeWindow({ from, to });
      if (start) query = query.gte('created_at', start.toISOString());

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      setHistory((data as unknown as IOperation[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [productId, from, to]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refresh: fetchHistory };
}
