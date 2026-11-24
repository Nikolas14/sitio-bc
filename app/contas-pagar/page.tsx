'use client';

import { useMemo, useState } from 'react';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import AdminPasswordModal from '@/components/AdminPasswordModal/AdminPasswordModal';
import { useBoletoManager, formVazio, type BoletoFormData } from '@/hooks/useBoletoManager';
import { useToast } from '@/components/Toast/Toast';
import SearchSelect, { normalize } from '@/components/SearchSelect/SearchSelect';
import { hojeLocal, statusBoleto, type FiltroStatus, type StatusBoleto } from '@/utils/boletos';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import type { IBoleto } from '@/types';
import styles from './page.module.css';

const STATUS_LABEL: Record<StatusBoleto, string> = {
    PAGO: 'Pago',
    VENCIDO: 'Vencido',
    VENCE_HOJE: 'Vence hoje',
    VENCE_EM_BREVE: 'Vence em breve',
    EM_ABERTO: 'Em aberto',
};

const STATUS_CLASS: Record<StatusBoleto, string> = {
    PAGO: styles.badgePago,
    VENCIDO: styles.badgeVencido,
    VENCE_HOJE: styles.badgeHoje,
    VENCE_EM_BREVE: styles.badgeBreve,
    EM_ABERTO: styles.badgeEmAberto,
};

const camposFicha: { key: keyof BoletoFormData; label: string; placeholder: string; full?: boolean; type?: string }[] = [
    { key: 'empresa', label: 'EMPRESA', placeholder: 'Nome da empresa', full: true },
    { key: 'numero', label: 'NÚMERO DO BOLETO', placeholder: 'Número do boleto' },
    { key: 'valor', label: 'VALOR (R$)', placeholder: '0,00' },
    { key: 'vencimento', label: 'VENCIMENTO', placeholder: '', type: 'date' },
];

const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const OPCOES_STATUS: { valor: FiltroStatus; rotulo: string }[] = [
    { valor: 'ABERTO', rotulo: 'Em aberto' },
    { valor: 'VENCIDO', rotulo: 'Vencidos' },
    { valor: 'VENCE_HOJE', rotulo: 'Vence hoje' },
    { valor: 'VENCE_EM_BREVE', rotulo: 'Vence em breve' },
    { valor: 'PAGO', rotulo: 'Pagos' },
    { valor: 'TODOS', rotulo: 'Todos' },
];

const matchesNome = (nome: string, q: string) => normalize(nome).includes(q);

// Datas vêm como YYYY-MM-DD: separar as partes evita o deslocamento de fuso que new Date() causaria.
const formatarData = (iso: string) => {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
};

export default function ContasPagar() {
    const manager = useBoletoManager();
    const { config } = useConfiguracoes();
    // Opções em ordem alfabética (pt-BR) nos campos e no filtro.
    const empresas = useMemo(
        () => [...(config?.empresas ?? [])].sort((a, b) => a.localeCompare(b, 'pt-BR')),
        [config?.empresas],
    );
    const bancos = useMemo(
        () => [...(config?.bancos ?? [])].sort((a, b) => a.localeCompare(b, 'pt-BR')),
        [config?.bancos],
    );
    const diasVenceEmBreve = config?.diasVenceEmBreve ?? 0;
    const toast = useToast();
    const [novo, setNovo] = useState<BoletoFormData>(formVazio);
    const [password, setPassword] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(null);
    // Ficha só para leitura até apertar "Editar".
    const [editing, setEditing] = useState(false);
    const [pagando, setPagando] = useState(false);
    const [banco, setBanco] = useState('');
    const [dataPagamento, setDataPagamento] = useState('');

    const hoje = hojeLocal();
    const selecionado = manager.boletos.find((boleto) => boleto.id === manager.selectedId) ?? null;
    const totalEmAberto = manager.boletos
        .filter((boleto) => !boleto.paid_at)
        .reduce((soma, boleto) => soma + boleto.valor, 0);
    const quantidadeEmAberto = manager.boletos.filter((boleto) => !boleto.paid_at).length;

    const abrirFicha = (boleto: IBoleto) => {
        manager.handleSelect(boleto);
        setEditing(false);
        setPagando(false);
        setBanco('');
    };

    const fecharFicha = () => {
        manager.setSelectedId(null);
        setEditing(false);
        setPagando(false);
        setBanco('');
    };

    const cancelEdit = () => {
        if (selecionado) manager.handleSelect(selecionado);
        setEditing(false);
    };

    // Cadastro novo não pede senha.
    const cadastrarNovo = async (e: React.FormEvent) => {
        e.preventDefault();
        const erro = await manager.createBoleto(novo);
        if (erro === null) {
            setNovo(formVazio);
            toast.success('Boleto cadastrado.');
        } else {
            toast.error(`Erro ao cadastrar boleto: ${erro}`);
        }
    };

    // Alterar um boleto existente pede senha.
    const requestSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
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
            const saveError = await manager.saveBoleto();
            if (saveError === null) {
                setEditing(false);
                toast.success('Boleto salvo com sucesso!');
            } else {
                toast.error(`Erro ao salvar boleto: ${saveError}`);
            }
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
        const erro = await manager.markPaid(banco, dataPagamento);
        if (erro === null) {
            setPagando(false);
            setBanco('');
            setDataPagamento('');
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

                <div className={styles.filtros}>
                    <span className={styles.filtroTitulo}>STATUS</span>
                    {OPCOES_STATUS.map(({ valor, rotulo }) => (
                        <button
                            key={valor}
                            type="button"
                            className={`${styles.filtroBtn} ${manager.filtroStatus === valor ? styles.filtroBtnAtivo : ''}`}
                            onClick={() => manager.setFiltroStatus(valor)}
                        >
                            {rotulo}
                        </button>
                    ))}
                    {manager.filtroStatus === 'ABERTO' && manager.totalPagos > 0 && (
                        <button type="button" className={styles.linkBtn} onClick={() => manager.setFiltroStatus('PAGO')}>
                            {manager.totalPagos} pagos ocultos · mostrar
                        </button>
                    )}

                    <span className={styles.filtroTitulo}>EMPRESA</span>
                    <SearchSelect
                        items={empresas}
                        selected={manager.filtroEmpresa || null}
                        onSelect={(nome) => manager.setFiltroEmpresa(nome ?? '')}
                        matches={matchesNome}
                        getKey={(nome) => nome}
                        getLabel={(nome) => nome}
                        placeholder="Todas as empresas"
                        emptyText="Empresa não encontrada"
                        maxResults={empresas.length}
                    />
                </div>
            </Sidebar>

            <Main className={styles.mainArea}>
                <form onSubmit={cadastrarNovo} className={styles.novoCard}>
                    <span className={styles.eyebrow}>NOVO BOLETO</span>
                    <div className={styles.novoRow}>
                        <div>
                            <span className={styles.label}>EMPRESA</span>
                            <SearchSelect
                                items={empresas}
                                selected={novo.empresa || null}
                                onSelect={(nome) => setNovo({ ...novo, empresa: nome ?? '' })}
                                matches={matchesNome}
                                getKey={(nome) => nome}
                                getLabel={(nome) => nome}
                                placeholder="Buscar empresa..."
                                emptyText="Empresa não encontrada"
                                maxResults={empresas.length}
                            />
                        </div>
                        <div>
                            <label className={styles.label} htmlFor="novo-numero">NÚMERO</label>
                            <input
                                id="novo-numero"
                                className={`${styles.input} ${styles.caps}`}
                                value={novo.numero}
                                onChange={(event) => setNovo({ ...novo, numero: event.target.value })}
                                placeholder="Número"
                            />
                        </div>
                        <div>
                            <label className={styles.label} htmlFor="novo-valor">VALOR (R$)</label>
                            <input
                                id="novo-valor"
                                inputMode="decimal"
                                className={styles.input}
                                value={novo.valor}
                                onChange={(event) => setNovo({ ...novo, valor: event.target.value })}
                                placeholder="0,00"
                                required
                            />
                        </div>
                        <div>
                            <label className={styles.label} htmlFor="novo-vencimento">VENCIMENTO</label>
                            <input
                                id="novo-vencimento"
                                type="date"
                                className={styles.input}
                                value={novo.vencimento}
                                onChange={(event) => setNovo({ ...novo, vencimento: event.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.btnSave} disabled={manager.loading}>Adicionar</button>
                    </div>
                </form>

                <div className={styles.listaCard}>
                    <div className={styles.listaHeader}>
                        <h2>Boletos</h2>
                        <span>{quantidadeEmAberto} em aberto · {formatarValor(totalEmAberto)}</span>
                    </div>

                    {manager.loading && manager.boletos.length === 0 ? (
                        <p className={styles.listMessage}>Carregando boletos...</p>
                    ) : manager.error && manager.boletos.length === 0 ? (
                        <p className={styles.listMessage}>Não foi possível carregar os boletos: {manager.error}</p>
                    ) : manager.filteredBoletos.length === 0 ? (
                        <p className={styles.listMessage}>Nenhum boleto encontrado.</p>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>VENCIMENTO</th>
                                        <th>EMPRESA</th>
                                        <th>NÚMERO</th>
                                        <th className={styles.alignRight}>VALOR</th>
                                        <th className={styles.alignCenter}>STATUS</th>
                                        <th>PAGAMENTO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {manager.filteredBoletos.map((boleto) => {
                                        const status = statusBoleto(boleto, hoje, diasVenceEmBreve);
                                        return (
                                            <tr key={boleto.id} className={styles.row} onClick={() => abrirFicha(boleto)}>
                                                <td>{formatarData(boleto.vencimento)}</td>
                                                <td className={styles.empresa}>{boleto.empresa}</td>
                                                <td>{boleto.numero}</td>
                                                <td className={styles.alignRight}>{formatarValor(boleto.valor)}</td>
                                                <td className={styles.alignCenter}><span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span></td>
                                                <td>
                                                    {boleto.paid_at
                                                        ? `${new Date(boleto.paid_at).toLocaleDateString('pt-BR')} · ${boleto.banco || '—'}`
                                                        : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Main>

            {selecionado && (
                <div className={styles.overlay} onClick={fecharFicha}>
                    <form
                        onSubmit={requestSave}
                        className={styles.modal}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={styles.formHeader}>
                            <div>
                                <span className={styles.eyebrow}>CONTAS A PAGAR</span>
                                <h2>{editing ? 'Editar boleto' : manager.formData.empresa || 'Boleto'}</h2>
                                <p>{editing ? 'Altere os dados e salve.' : 'Somente leitura. Clique em Editar para alterar.'}</p>
                            </div>
                            <div className={styles.headerActions}>
                                {!editing && (
                                    <button type="button" className={styles.btnSave} onClick={() => setEditing(true)} disabled={manager.loading}>Editar</button>
                                )}
                                <button type="button" className={styles.closeButton} onClick={fecharFicha} aria-label="Fechar">×</button>
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            {camposFicha.map(({ key, label, placeholder, full, type }) => (
                                <div key={key} className={full ? styles.full : ''}>
                                    {editing && key === 'empresa' ? (
                                        <>
                                            <span className={styles.label}>{label}</span>
                                            <SearchSelect
                                                items={empresas}
                                                selected={manager.formData.empresa || null}
                                                onSelect={(nome) => manager.setFormData({ ...manager.formData, empresa: nome ?? '' })}
                                                matches={matchesNome}
                                                getKey={(nome) => nome}
                                                getLabel={(nome) => nome}
                                                placeholder="Buscar empresa..."
                                                emptyText="Empresa não encontrada"
                                                maxResults={empresas.length}
                                            />
                                        </>
                                    ) : editing ? (
                                        <>
                                            <label className={styles.label} htmlFor={`ficha-${key}`}>{label}</label>
                                            <input
                                                id={`ficha-${key}`}
                                                type={type ?? 'text'}
                                                inputMode={key === 'valor' ? 'decimal' : undefined}
                                                className={key === 'valor' || key === 'vencimento' ? styles.input : `${styles.input} ${styles.caps}`}
                                                value={manager.formData[key]}
                                                onChange={(event) => manager.setFormData({ ...manager.formData, [key]: event.target.value })}
                                                placeholder={placeholder}
                                                required={key !== 'numero'}
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
                        </div>

                        {!editing && (
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
                                        <div className={styles.paymentRow}>
                                            <div className={styles.paymentDate}>
                                                <label className={styles.label} htmlFor="data-pagamento">DATA DO PAGAMENTO</label>
                                                <input
                                                    id="data-pagamento"
                                                    type="date"
                                                    className={styles.input}
                                                    value={dataPagamento}
                                                    onChange={(event) => setDataPagamento(event.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className={styles.paymentSelect}>
                                                <span className={styles.label}>BANCO DO PAGAMENTO</span>
                                                <SearchSelect
                                                    items={bancos}
                                                    selected={banco || null}
                                                    onSelect={(nome) => setBanco(nome ?? '')}
                                                    matches={matchesNome}
                                                    getKey={(nome) => nome}
                                                    getLabel={(nome) => nome}
                                                    placeholder="Buscar banco..."
                                                    emptyText="Banco não encontrado"
                                                    maxResults={bancos.length}
                                                />
                                            </div>
                                            <button type="button" className={styles.btnSave} onClick={confirmarPagamento} disabled={manager.loading}>
                                                Confirmar pagamento
                                            </button>
                                        </div>
                                        <div className={styles.paymentActions}>
                                            <button type="button" className={styles.btnCancel} onClick={() => { setPagando(false); setBanco(''); setDataPagamento(''); }}>Cancelar</button>
                                        </div>
                                    </>
                                ) : (
                                    <button type="button" className={styles.btnPay} onClick={() => { setDataPagamento(hoje); setPagando(true); }} disabled={manager.loading}>
                                        Marcar como pago
                                    </button>
                                )}
                            </div>
                        )}

                        {editing ? (
                            <div className={styles.formActions}>
                                <button type="button" className={styles.btnDelete} onClick={requestDelete} disabled={manager.loading}>Excluir boleto</button>
                                <div className={styles.rightActions}>
                                    <button type="button" className={styles.btnCancel} onClick={cancelEdit}>Cancelar</button>
                                    <button type="submit" className={styles.btnSave} disabled={manager.loading}>{manager.loading ? 'Salvando...' : 'Salvar boleto'}</button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.formActions}>
                                <button type="button" className={styles.btnDelete} onClick={requestDelete} disabled={manager.loading}>Excluir boleto</button>
                                <div className={styles.rightActions}>
                                    <button type="button" className={styles.btnCancel} onClick={fecharFicha}>Fechar</button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            )}

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
