'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import type { IProjectionItem } from './useProjectionsList';

export function useProjectionsManager() {
  const [projections, setProjections] = useState<IProjectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  
  // Estados do Modal e Segurança
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');

  const fetchProjections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ESTOQUE_projection')
      .select(`*, ESTOQUE_product ( name )`)
      .order('created_at', { ascending: false });

    if (!error) setProjections((data as IProjectionItem[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase
      .from('ESTOQUE_projection')
      .select(`*, ESTOQUE_product ( name )`)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setProjections((data as IProjectionItem[]) || []);
        setLoading(false);
      });
  }, []);

  // Agrupamento automático
  const groupedProjections = useMemo(() => {
    return projections.reduce((acc: Record<string, IProjectionItem[]>, item) => {
      const ref = item.reference || 'Sem Referência';
      if (!acc[ref]) acc[ref] = [];
      acc[ref].push(item);
      return acc;
    }, {});
  }, [projections]);

  // Itens da carga selecionada no momento
  const activeItems = useMemo(() => {
    return selectedRef ? groupedProjections[selectedRef] || [] : [];
  }, [selectedRef, groupedProjections]);

  // Lógica de exclusão
  const handleDelete = async () => {
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      alert("Senha incorreta!");
      return false;
    }

    const { error } = await supabase
      .from('ESTOQUE_projection')
      .delete()
      .eq('reference', selectedRef);

    if (!error) {
      setShowModal(false);
      setPassword('');
      setSelectedRef(null);
      await fetchProjections();
      return true;
    }
    
    alert("Erro ao excluir.");
    return false;
  };

  return {
    groupedProjections,
    loading,
    selectedRef,
    setSelectedRef,
    activeItems,
    showModal,
    setShowModal,
    password,
    setPassword,
    handleDelete,
    refresh: fetchProjections
  };
}