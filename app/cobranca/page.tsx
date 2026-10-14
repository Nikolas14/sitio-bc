'use client';

import styles from './page.module.css';
import { useState, useMemo } from 'react';

import { useCobrancas } from '@/hooks/useCobrancas';

import HeaderInput from '@/components/HeaderInput/HeaderInput';
import StatusFilter from '@/components/StatusFilter/StatusFilter';
import SideFooter from '@/components/SideFooter/SideFooter';
import CobrancaTable from './components/CobrancaTable/CobrancaTable';
import { STATUS_COBRANCA } from '@/types';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';

const STATUS_LIST = STATUS_COBRANCA;

export default function ListaCobrancasPage() {
  const { transactions, loading, error, refresh } = useCobrancas();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [hideConcluded, setHideConcluded] = useState(true);

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // Selecionar CONCLUIDO no filtro de status vence o "ocultar concluídos".
  const concludedHidden = hideConcluded && !selectedStatus.includes('CONCLUIDO');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const status = t.status || 'PENDENTE';
      const matchStatus = selectedStatus.length === 0 || selectedStatus.includes(status);
      const matchConcluded = !concludedHidden || status !== 'CONCLUIDO';
      const matchSearch = t.customer_vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.serial_number?.toString().includes(searchTerm);

      return matchStatus && matchConcluded && matchSearch;
    });
  }, [transactions, selectedStatus, searchTerm, concludedHidden]);

  const concludedCount = useMemo(
    () => transactions.filter(t => t.status === 'CONCLUIDO').length,
    [transactions]
  );

  if (error) return <div className={styles.error}>Erro: {error}</div>;

  return (
    <PageLayout>

      <Sidebar>
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

        <label className={`${styles.hideToggle} ${!concludedHidden && hideConcluded ? styles.hideToggleOff : ''}`}>
          <input
            type="checkbox"
            checked={hideConcluded}
            onChange={(e) => setHideConcluded(e.target.checked)}
          />
          <span>
            Ocultar concluídos ({concludedCount})
            {hideConcluded && !concludedHidden && (
              <small className={styles.hideHint}>CONCLUIDO selecionado no filtro</small>
            )}
          </span>
        </label>

        <SideFooter onRefresh={refresh} refreshLabel="Sincronizar Dados" />

      </Sidebar>

      <Main>
        <CobrancaTable
          transactions={filteredTransactions}
          loading={loading}
        />
      </Main>
    </PageLayout>
  );
}