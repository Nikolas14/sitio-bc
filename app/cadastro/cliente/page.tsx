'use client';

import { useState } from 'react';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import AdminPasswordModal from '@/components/AdminPasswordModal/AdminPasswordModal';
import { useCustomerManager } from '@/hooks/useCustomerManager';
import { useToast } from '@/components/Toast/Toast';
import styles from './page.module.css';

const fields = [
    ['name', 'NOME', 'Nome completo'],
    ['cpf', 'CPF', '000.000.000-00'],
    ['address', 'ENDEREÇO', 'Rua, número e complemento'],
    ['cep', 'CEP', '00000-000'],
    ['phone', 'TELEFONE', '(00) 00000-0000'],
    ['city', 'CIDADE', 'Cidade e estado'],
    ['airport', 'AEROPORTO', 'Ex.: GUARULHOS (GRU)'],
    ['pickup_person', 'RETIRADA', 'Nome de quem retira'],
    ['pickup_cpf', 'CPF RETIRADA', 'CPF de quem retira'],
    ['alternative_pickup_person', 'RETIRADA ALTERNATIVA', 'Nome da retirada alternativa'],
    ['alternative_pickup_cpf', 'CPF RETIRADA ALTERNATIVA', 'CPF da retirada alternativa'],
] as const;

export default function GerenciadorClientes() {
    const manager = useCustomerManager();
    const toast = useToast();
    const [password, setPassword] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(null);

    const requestSave = (e: React.FormEvent) => {
        e.preventDefault();
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
            const saveError = await manager.saveCustomer();
            if (saveError === null) toast.success('Cliente salvo com sucesso!');
            else toast.error(`Erro ao salvar cliente: ${saveError}`);
        } else if (pendingAction === 'delete') {
            const deleteError = await manager.deleteCustomer();
            if (deleteError === null) toast.success('Cliente excluído.');
            else toast.error(`Erro ao excluir cliente: ${deleteError}`);
        }
        setPendingAction(null);
    };

    return (
        <PageLayout>
            <Sidebar>
                <div className={styles.sidebarTop}>
                    <HeaderInput
                        titulo="Clientes"
                        setValor={manager.setSearchTerm}
                        valor={manager.searchTerm}
                        labelDescricao="Pesquise por nome, CPF ou telefone:"
                        placeholder="Digite para buscar..."
                    />
                </div>

                <nav className={styles.customerList}>
                    {manager.loading && !manager.selectedId ? (
                        <p className={styles.listMessage}>Carregando clientes...</p>
                    ) : manager.filteredCustomers.length === 0 ? (
                        <p className={styles.listMessage}>Nenhum cliente encontrado.</p>
                    ) : manager.filteredCustomers.map((customer) => (
                        <button
                            type="button"
                            key={customer.id}
                            className={`${styles.customerItem} ${manager.selectedId === customer.id ? styles.active : ''}`}
                            onClick={() => manager.handleSelect(customer)}
                        >
                            <span className={styles.itemName}>{customer.name}</span>
                            <span className={styles.itemDetails}>{customer.cpf || 'CPF não informado'}{customer.city ? ` · ${customer.city}` : ''}</span>
                        </button>
                    ))}
                </nav>

                <div className={styles.sidebarBottom}>
                    <button type="button" className={styles.btnAdd} onClick={() => manager.handleSelect('new')}>
                        + Novo Cliente
                    </button>
                </div>
            </Sidebar>

            <Main className={styles.formArea}>
                {manager.selectedId ? (
                    <form onSubmit={requestSave} className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <div>
                                <span className={styles.eyebrow}>CADASTRO DE CLIENTES</span>
                                <h2>{manager.selectedId === 'new' ? 'Novo cliente' : 'Editar cliente'}</h2>
                                <p>{manager.selectedId === 'new' ? 'Preencha os dados para criar um cadastro.' : 'Atualize os dados deste cadastro.'}</p>
                            </div>
                            <button type="button" className={styles.closeButton} onClick={() => manager.setSelectedId(null)} aria-label="Fechar">×</button>
                        </div>

                        <div className={styles.formGrid}>
                            {fields.map(([key, label, placeholder]) => (
                                <div key={key} className={key === 'address' || key === 'alternative_pickup_person' ? styles.full : ''}>
                                    <label className={styles.label} htmlFor={key}>{label}</label>
                                    <input
                                        id={key}
                                        className={styles.input}
                                        value={manager.formData[key]}
                                        onChange={(event) => manager.setFormData({ ...manager.formData, [key]: event.target.value })}
                                        placeholder={placeholder}
                                        required={key === 'name'}
                                    />
                                </div>
                            ))}
                            <div className={styles.full}>
                                <label className={styles.label} htmlFor="notes">OBS</label>
                                <textarea
                                    id="notes"
                                    className={styles.textarea}
                                    value={manager.formData.notes}
                                    onChange={(event) => manager.setFormData({ ...manager.formData, notes: event.target.value })}
                                    placeholder="Informações adicionais"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            {manager.selectedId !== 'new' && <button type="button" className={styles.btnDelete} onClick={requestDelete} disabled={manager.loading}>Excluir cliente</button>}
                            <div className={styles.rightActions}>
                                <button type="button" className={styles.btnCancel} onClick={() => manager.setSelectedId(null)}>Cancelar</button>
                                <button type="submit" className={styles.btnSave} disabled={manager.loading}>{manager.loading ? 'Salvando...' : 'Salvar cliente'}</button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>◌</div>
                        <h2>Cadastro de clientes</h2>
                        <p>Selecione um cliente na lista ou comece um novo cadastro.</p>
                        <button type="button" className={styles.btnSave} onClick={() => manager.handleSelect('new')}>Novo cliente</button>
                    </div>
                )}
            </Main>

            {showModal && (
                <AdminPasswordModal
                    password={password}
                    setPassword={setPassword}
                    onConfirm={confirmModal}
                    onCancel={cancelModal}
                />
            )}
        </PageLayout>
    );
}
