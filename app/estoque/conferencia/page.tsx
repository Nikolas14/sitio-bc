'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useStockAdjustment } from '@/hooks/useStockAdjustment';
import { parseScaleBarcode } from '@/utils/barcodeParser';
import { buildAdjustmentLines, summarizeAdjustment, roundKg, isCountable, TIPOS_FORA_CONFERENCIA } from '@/utils/stockCount';
import { verifyAdminPassword } from '@/utils/adminAuth';

import BarcodeScanner from '@/components/BarcodeScanner/BarcodeScanner';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import AdminPasswordModal from '@/components/AdminPasswordModal/AdminPasswordModal';
import ModalConfirmacao from '@/components/ModalConfirmacao/ModalConfirmacao';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useToast } from '@/components/Toast/Toast';
import CountDiffTable from './components/CountDiffTable/CountDiffTable';
import ScannedLabelsList, { IScannedLabel } from './components/ScannedLabelsList/ScannedLabelsList';

import styles from './page.module.css';

// Rascunho local: a contagem pode levar tempo e não deve se perder num F5.
const DRAFT_KEY = 'sitio-bc:conferencia-estoque';

function loadDraft(): IScannedLabel[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as IScannedLabel[]) : [];
  } catch {
    return [];
  }
}

function saveDraft(labels: IScannedLabel[]) {
  try {
    if (labels.length === 0) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, JSON.stringify(labels));
  } catch {
    // Sem storage disponível a conferência segue só em memória.
  }
}

type Tab = 'divergencias' | 'etiquetas';

export default function ConferenciaEstoquePage() {
  const { products, loading: loadingInventory, refresh } = useInventory();
  const { applyAdjustment, saving } = useStockAdjustment();
  const toast = useToast();

  const [labels, setLabels] = useState<IScannedLabel[]>([]);
  const [draftReady, setDraftReady] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('divergencias');
  const [onlyDivergent, setOnlyDivergent] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [password, setPassword] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setLabels(loadDraft());
      setDraftReady(true);
    });
  }, []);

  useEffect(() => {
    if (draftReady) saveDraft(labels);
  }, [labels, draftReady]);

  const countedByProduct = useMemo(() => {
    return labels.reduce<Record<number, number>>((acc, l) => {
      acc[l.productId] = roundKg((acc[l.productId] || 0) + l.weightKg);
      return acc;
    }, {});
  }, [labels]);

  const lines = useMemo(() => buildAdjustmentLines(products, countedByProduct), [products, countedByProduct]);
  const summary = useMemo(() => summarizeAdjustment(lines), [lines]);
  const totalKg = useMemo(() => roundKg(labels.reduce((acc, l) => acc + l.weightKg, 0)), [labels]);

  const handleBarcode = (val: string) => {
    setBarcode(val);
    setLastError(null);

    if (val.length !== 13) return;

    const parsed = parseScaleBarcode(val);
    if (!parsed) {
      setLastError('Código de barras inválido');
      setBarcode('');
      return;
    }

    const prod = products.find((p) => p.id === parsed.productId);
    if (!prod) {
      setLastError(`Produto #${parsed.productId} não cadastrado`);
      setBarcode('');
      return;
    }

    if (!isCountable(prod)) {
      setLastError(`${prod.name} (${prod.type}) fica fora da conferência`);
      setBarcode('');
      return;
    }

    if (labels.some((l) => l.barcode === val)) {
      toast.error('Etiqueta igual a outra já bipada — confira se não é repetida.');
    }

    setLabels((prev) => [{
      tempId: Date.now() + Math.random(),
      barcode: val,
      productId: parsed.productId,
      name: prod.name,
      weightKg: parsed.weightKg,
    }, ...prev]);
    setBarcode('');
    inputRef.current?.focus();
  };

  const removeLabel = (tempId: number) => {
    setLabels((prev) => prev.filter((l) => l.tempId !== tempId));
    inputRef.current?.focus();
  };

  const openApply = async () => {
    await refresh();
    setPassword('');
    setShowPassword(true);
  };

  const closePassword = () => {
    setShowPassword(false);
    setPassword('');
    inputRef.current?.focus();
  };

  const confirmApply = async () => {
    const ok = await verifyAdminPassword(password);
    if (!ok) {
      toast.error('Senha de administrador incorreta!');
      return;
    }

    setShowPassword(false);
    setPassword('');

    const res = await applyAdjustment(countedByProduct);
    if (!res.success) {
      toast.error('Erro ao aplicar ajuste: ' + res.error);
      refresh();
      return;
    }

    if (res.entradas + res.saidas === 0) {
      toast.success('Estoque já batia com a conferência. Nada a ajustar.');
    } else {
      toast.success(`Ajuste aplicado: ${res.entradas} entrada(s) e ${res.saidas} saída(s).`);
    }
    setLabels([]);
    refresh();
    inputRef.current?.focus();
  };

  const confirmDiscard = () => {
    setLabels([]);
    setShowDiscard(false);
    inputRef.current?.focus();
  };

  const divergentes = summary.entradas + summary.saidas;

  return (
    <PageLayout>
      <Sidebar>
        <HeaderPadrao titulo="Conferência de Estoque" />

        <div className={`${styles.scannerContainer} ${lastError ? styles.hasError : ''}`}>
          <BarcodeScanner ref={inputRef} barcode={barcode} onChange={handleBarcode} />
          {lastError && <span className={styles.errorMsg}>⚠️ {lastError}</span>}
        </div>

        <p className={styles.notice}>
          Conferência <strong>total</strong>: produto não bipado terá o saldo zerado
          (exceto {TIPOS_FORA_CONFERENCIA.join(', ')}, que fica de fora).
          Evite vender durante a contagem.
        </p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.label}>Etiquetas</span>
            <span className={styles.value}>{labels.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Kg contado</span>
            <span className={styles.value}>{totalKg.toFixed(2)}</span>
          </div>
          <div className={`${styles.stat} ${styles.statIn}`}>
            <span className={styles.label}>Entradas ({summary.entradas})</span>
            <span className={styles.value}>+{summary.entradaKg.toFixed(2)}</span>
          </div>
          <div className={`${styles.stat} ${styles.statOut}`}>
            <span className={styles.label}>Saídas ({summary.saidas})</span>
            <span className={styles.value}>−{summary.saidaKg.toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnApply}
            onClick={openApply}
            disabled={labels.length === 0 || saving || loadingInventory}
          >
            {saving ? 'Aplicando...' : `Aplicar ajuste (${divergentes} produto${divergentes === 1 ? '' : 's'})`}
          </button>
          <button
            className={styles.btnDiscard}
            onClick={() => setShowDiscard(true)}
            disabled={labels.length === 0 || saving}
          >
            Descartar conferência
          </button>
        </div>
      </Sidebar>

      <Main>
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'divergencias' ? styles.tabActive : ''}`}
              onClick={() => setTab('divergencias')}
            >
              Divergências ({divergentes})
            </button>
            <button
              className={`${styles.tab} ${tab === 'etiquetas' ? styles.tabActive : ''}`}
              onClick={() => setTab('etiquetas')}
            >
              Etiquetas bipadas ({labels.length})
            </button>
          </div>

          {tab === 'divergencias' && (
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={onlyDivergent}
                onChange={(e) => setOnlyDivergent(e.target.checked)}
              />
              Só divergências
            </label>
          )}
        </div>

        {tab === 'divergencias' ? (
          loadingInventory && products.length === 0
            ? <div className={styles.loading}>Carregando saldos...</div>
            : <CountDiffTable lines={lines} onlyDivergent={onlyDivergent} />
        ) : (
          <ScannedLabelsList labels={labels} onRemove={removeLabel} />
        )}
      </Main>

      {showPassword && (
        <AdminPasswordModal
          password={password}
          setPassword={setPassword}
          onConfirm={confirmApply}
          onCancel={closePassword}
          subtitle={`Lançar ${summary.entradas} entrada(s) (+${summary.entradaKg.toFixed(2)} kg) e ${summary.saidas} saída(s) (−${summary.saidaKg.toFixed(2)} kg)?`}
        />
      )}

      <ModalConfirmacao
        isOpen={showDiscard}
        onClose={() => setShowDiscard(false)}
        onConfirm={confirmDiscard}
        titulo="Descartar conferência?"
        mensagem={`As ${labels.length} etiquetas bipadas serão apagadas. Nenhum estoque é alterado.`}
      />
    </PageLayout>
  );
}
