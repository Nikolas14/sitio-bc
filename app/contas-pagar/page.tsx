'use client';

import { useState } from 'react';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import AdminPasswordModal from '@/components/AdminPasswordModal/AdminPasswordModal';
import { useBoletoManager, type BoletoFormData } from '@/hooks/useBoletoManager';
import { useToast } from '@/components/Toast/Toast';
import { BANCOS_SUGERIDOS, hojeLocal, statusBoleto, type StatusBoleto } from '@/utils/boletos';
import type { IBoleto } from '@/types';
import styles from './page.module.css';

const STATUS_LABEL: Record<StatusBoleto, string> = {
    PAGO: 'Pago',
    VENCIDO: 'Vencido',
    VENCE_EM_BREVE: 'Vence em breve',
    EM_ABERTO: 'Em aberto',
};

const STATUS_CLASS: Record<StatusBoleto, string> = {
    PAGO: styles.badgePago,
    VENCIDO: styles.badgeVencido,
    VENCE_EM_BREVE: styles.badgeBreve,
    EM_ABERTO: styles.badgeEmAberto,
};

const campos: { key: keyof BoletoFormData; label: string; placeholder: string; full?: boolean; type?: string }[] = [
    { key: 'empresa', label: 'EMPRESA', placeholder: 'Nome da empresa', full: true },
    { key: 'numero', label: 'NÚMERO DO BOLETO', placeholder: 'Número do boleto' },
    { key: 'valor', label: 'VALOR (R$)', placeholder: '0,00' },
    { key: 'vencimento', label: 'VENCIMENTO', placeholder: '', type: 'date' },
];

const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Datas vêm como YYYY-MM-DD: separar as partes evita o deslocamento de fuso que new Date() causaria.
const formatarData = (iso: string) => {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
};

export default function ContasPagar() {
    const manager = useBoletoManager();
    const toast = useToast();
    const [password, setPassword] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(null);
    // Ficha só para leitura até apertar "Editar"; boleto novo já abre editável.
    const [editing, setEditing] = useState(false);
    const [pagando, setPagando] = useState(false);
    const [banco, setBanco] = useState('');

    const hoje = hojeLocal();
    const isNew = manager.selectedId === 'new';
    const selecionado = manager.boletos.find((boleto) => boleto.id === manager.selectedId) ?? null;

    const selectBoleto = (boleto: IBoleto | 'new') => {
        manager.handleSelect(boleto);
        setEditing(boleto === 'new');
        setPagando(false);
        setBanco('');
    };

    const cancelEdit = () => {
        if (isNew) {
            manager.setSelectedId(null);
        } else if (selecionado) {
            manager.handleSelect(selecionado);
        }
        setEditing(false);
    };

    const gravarBoleto = async () => {
        const saveError = await manager.saveBoleto();
        if (saveError === null) {
            setEditing(false);
            toast.success('Boleto salvo com sucesso!');
        } else {
            toast.error(`Erro ao salvar boleto: ${saveError}`);
        }
    };

    // Cadastrar boleto novo não pede senha; alterar um boleto existente pede.
    const requestSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        if (isNew) {
            await gravarBoleto();
            return;
        }
        setPendingAction('save');
        setShowModal(true);
    };

    const requestDelete = () => {
        setPendingAction('delete');
        setShowModal(true);
    };

    const cancelModal = () => {
        setShowModal(false);
        setPassword('');
        setPendingAction(null);
    };

    const confirmModal = async () => {
        const { verifyAdminPassword } = await import('@/utils/adminAuth');
        const ok = await verifyAdminPassword(password);
        if (!ok) {
            toast.error('Senha de administrador incorreta!');
            return;
        }
        setShowModal(false);
        setPassword('');

        if (pendingAction === 'save') {
            await gravarBoleto();
        } else if (pendingAction === 'delete') {
            const deleteError = await manager.deleteBoleto();
            if (deleteError === null) {
                setEditing(false);
                toast.success('Boleto excluído.');
            } else {
                toast.error(`Erro ao excluir boleto: ${deleteError}`);
            }
        }
        setPendingAction(null);
    };

    // Marcar e desfazer pagamento não pedem senha de administrador (decisão do plano).
    const confirmarPagamento = async () => {
        const erro = await manager.markPaid(banco);
        if (erro === null) {
            setPagando(false);
            setBanco('');
            toast.success('Pagamento registrado.');
        } else {
            toast.error(`Erro ao registrar pagamento: ${erro}`);
        }
    };

    const desfazerPagamento = async () => {
        const erro = await manager.undoPaid();
        if (erro === null) {
            toast.success('Pagamento desfeito.');
        } else {
            toast.error(`Erro ao desfazer pagamento: ${erro}`);
        }
    };

    const valorExibido = (key: keyof BoletoFormData) => {
        const value = manager.formData[key];
        if (key === 'vencimento') return value ? formatarData(value) : '';
        if (key === 'valor') return value ? `R$ ${value}` : '';
        return value;
    };

    return (
        <PageLayout>
            <Sidebar>
                <div className={styles.sidebarTop}>
                    <HeaderInput
                        titulo="Contas a pagar"
                        setValor={manager.setSearchTerm}
                        valor={manager.searchTerm}
                        labelDescricao="Pesquise por número ou empresa:"
                        placeholder="Digite para buscar..."
                    />
                </div>

                <nav className={styles.customerList}>
                    {manager.loading && !manager.selectedId ? (
                        <p className={styles.listMessage}>Carregando boletos...</p>
                    ) : manager.error && manager.boletos.length === 0 ? (
                        <p className={styles.listMessage}>Não foi possível carregar os boletos: {manager.error}</p>
                    ) : manager.filteredBoletos.length === 0 ? (
                        <p className={styles.listMessage}>Nenhum boleto encontrado.</p>
                    ) : manager.filteredBoletos.map((boleto) => {
                        const status = statusBoleto(boleto, hoje);
                        return (
                            <button
                                type="button"
                                key={boleto.id}
                                className={`${styles.customerItem} ${manager.selectedId === boleto.id ? styles.active : ''}`}
                                onClick={() => selectBoleto(boleto)}
                            >
                                <span className={styles.itemName}>{boleto.empresa}</span>
                                <span className={styles.itemDetails}>
                                    {boleto.numero} · vence {formatarData(boleto.vencimento)} · {formatarValor(boleto.valor)}
                                </span>
                                <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className={styles.sidebarBottom}>
                    <button type="button" className={styles.btnAdd} onClick={() => selectBoleto('new')}>
                        + Novo boleto
                    </button>
                </div>
            </Sidebar>

            <Main className={styles.formArea}>
                {manager.selectedId ? (
                    <form onSubmit={requestSave} className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <div>
                                <span className={styles.eyebrow}>CONTAS A PAGAR</span>
                                <h2>{isNew ? 'Novo boleto' : editing ? 'Editar boleto' : manager.formData.empresa || 'Boleto'}</h2>
                                <p>
                                    {isNew
                                        ? 'Preencha os dados para cadastrar o boleto.'
                                        : editing
                                            ? 'Altere os dados e salve.'
                                            : 'Somente leitura. Clique em Editar para alterar.'}
                                </p>
                            </div>
                            <div className={styles.headerActions}>
                                {!editing && (
                                    <button type="button" className={styles.btnSave} onClick={() => setEditing(true)} disabled={manager.loading}>Editar</button>
                                )}
                                <button type="button" className={styles.closeButton} onClick={() => manager.setSelectedId(null)} aria-label="Fechar">×</button>
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            {campos.map(({ key, label, placeholder, full, type }) => (
                                <div key={key} className={full ? styles.full : ''}>
                                    {editing ? (
                                        <>
                                            <label className={styles.label} htmlFor={key}>{label}</label>
                                            <input
                                                id={key}
                                                type={type ?? 'text'}
                                                inputMode={key === 'valor' ? 'decimal' : undefined}
                                                className={key === 'empresa' ? `${styles.input} ${styles.caps}` : styles.input}
                                                list={key === 'empresa' ? 'empresas-sugeridas' : undefined}
                                                value={manager.formData[key]}
                                                onChange={(event) => manager.setFormData({ ...manager.formData, [key]: event.target.value })}
                                                placeholder={placeholder}
                                                required
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <span className={styles.label}>{label}</span>
                                            <p className={styles.viewValue}>{valorExibido(key) || '—'}</p>
                                        </>
                                    )}
                                </div>
                            ))}
                            {editing && (
                                <datalist id="empresas-sugeridas">
                                    {manager.empresasSugeridas.map((nome) => <option key={nome} value={nome} />)}
                                </datalist>
                            )}
                        </div>

                        {!isNew && selecionado && !editing && (
                            <div className={styles.paymentBox}>
                                {selecionado.paid_at ? (
                                    <>
                                        <p className={styles.paymentText}>
                                            Pago em {new Date(selecionado.paid_at).toLocaleDateString('pt-BR')} · banco {selecionado.banco || '—'}
                                        </p>
                                        <div className={styles.paymentActions}>
                                            <button type="button" className={styles.btnCancel} onClick={desfazerPagamento} disabled={manager.loading}>Desfazer pagamento</button>
                                        </div>
                                    </>
                                ) : pagando ? (
                                    <>
                                        <label className={styles.label} htmlFor="banco">BANCO DO PAGAMENTO</label>
                                        <div className={styles.paymentRow}>
                                            <input
                                                id="banco"
                                                list="bancos-sugeridos"
                                                className={styles.input}
                                                value={banco}
                                                onChange={(event) => setBanco(event.target.value)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        void confirmarPagamento();
                                                    }
                                                }}
                                                placeholder="Escolha ou digite o banco"
                                            />
                                            <datalist id="bancos-sugeridos">
                                                {BANCOS_SUGERIDOS.map((nome) => <option key={nome} value={nome} />)}
                                            </datalist>
                                            <button type="button" className={styles.btnSave} onClick={confirmarPagamento} disabled={manager.loading}>
                                                Confirmar pagamento
                                            </button>
                                        </div>
                                        <div className={styles.paymentActions}>
                                            <button type="button" className={styles.btnCancel} onClick={() => { setPagando(false); setBanco(''); }}>Cancelar</button>
                                        </div>
                                    </>
                                ) : (
                                    <button type="button" className={styles.btnPay} onClick={() => setPagando(true)} disabled={manager.loading}>
                                        Marcar como pago
                                    </button>
                                )}
                            </div>
                        )}

                        {editing ? (
                            <div className={styles.formActions}>
                                {!isNew && <button type="button" className={styles.btnDelete} onClick={requestDelete} disabled={manager.loading}>Excluir boleto</button>}
                                <div className={styles.rightActions}>
                                    <button type="button" className={styles.btnCancel} onClick={cancelEdit}>Cancelar</button>
                                    <button type="submit" className={styles.btnSave} disabled={manager.loading}>{manager.loading ? 'Salvando...' : 'Salvar boleto'}</button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.formActions}>
                                <button type="button" className={styles.btnDelete} onClick={requestDelete} disabled={manager.loading}>Excluir boleto</button>
                                <div className={styles.rightActions}>
                                    <button type="button" className={styles.btnCancel} onClick={() => manager.setSelectedId(null)}>Fechar</button>
                                </div>
                            </div>
                        )}
                    </form>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>◌</div>
                        <h2>Contas a pagar</h2>
                        <p>Selecione um boleto na lista ou cadastre um novo.</p>
                        <button type="button" className={styles.btnSave} onClick={() => selectBoleto('new')}>Novo boleto</button>
                    </div>
                )}
            </Main>

            {showModal && (
                <AdminPasswordModal
                    password={password}
                    setPassword={setPassword}
                    subtitle={pendingAction === 'save' ? 'Confirme a senha para salvar o boleto' : 'Confirme a senha para realizar esta exclusão'}
                    onConfirm={confirmModal}
                    onCancel={cancelModal}
                />
            )}
        </PageLayout>
    );
}
