'use client';

import styles from './page.module.css';
import { useState, useMemo } from 'react';

import { useCobrancas } from '@/hooks/useCobrancas';

import HeaderInput from '@/components/HeaderInput/HeaderInput';
import StatusFilter from '@/components/StatusFilter/StatusFilter';
import SideFooter from '@/components/SideFooter/SideFooter';
import CobrancaTable from './components/CobrancaTable/CobrancaTable';
import { STATUS_LIST_ALL } from '@/types';

const STATUS_LIST = STATUS_LIST_ALL;

export default function ListaCobrancasPage() {
  const { transactions, loading, error, refresh } = useCobrancas();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Se o array de status estiver vazio, mostra todos. Se não, checa se o status da transação está no array.
      const matchStatus = selectedStatus.length === 0 || selectedStatus.includes(t.status || 'PENDENTE');
      const matchSearch = t.customer_vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.serial_number?.toString().includes(searchTerm);

      return matchStatus && matchSearch;
    });
  }, [transactions, selectedStatus, searchTerm]);

  if (error) return <div className={styles.error}>Erro: {error}</div>;

  return (
    <div className={styles.screen}>
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className={styles.sidebar}>

        <HeaderInput
          titulo="Cobrança"
          labelDescricao="Buscar por Cliente"
          valor={searchTerm}
          setValor={setSearchTerm}
          placeholder="Nome ou Série..."
        />

        <StatusFilter
          label="Filtrar Status"
          options={STATUS_LIST}
          selectedOptions={selectedStatus}
          onToggle={toggleStatus}
          onClear={() => setSelectedStatus([])}
        />


        <SideFooter onRefresh={refresh} refreshLabel="Sincronizar Dados">

        </SideFooter>

      </aside>

      {/* ÁREA PRINCIPAL (MAIN CONTENT) */}
      <main className={styles.mainContent}>

        <CobrancaTable 
          transactions={filteredTransactions} 
          loading={loading} 
        />
      </main>
    </div>
  );
}