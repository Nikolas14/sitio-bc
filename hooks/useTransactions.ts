'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import { ITransaction } from '@/types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Busca inicial das transações
  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ESTOQUE_transaction')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Erro ao buscar transações:', error);

    setTransactions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Lógica de filtragem memoizada para performance
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchName = t.customer_vendor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = filterDate ? t.created_at.startsWith(filterDate) : true;
      return matchName && matchDate;
    });
  }, [transactions, searchTerm, filterDate]);

  return {
    transactions: filteredTransactions,
    loading,
    searchTerm,
    setSearchTerm,
    filterDate,
    setFilterDate,
    refresh: fetchTransactions,
  };
}