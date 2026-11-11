'use client';

import { useState } from 'react';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import AdminPasswordModal from '@/components/AdminPasswordModal/AdminPasswordModal';
import { useEmployeeManager } from '@/hooks/useEmployeeManager';
import { useToast } from '@/components/Toast/Toast';
import type { IEmployee } from '@/types';
import styles from './page.module.css';

const fields = [
    ['name', 'NOME', 'Nome completo'],
    ['group_name', 'GRUPO', ''],
    ['phone', 'TELEFONE', '(00) 00000-0000'],
    ['cpf', 'CPF', '000.000.000-00'],
    ['rg', 'RG', 'Número do RG'],
    ['pix_key', 'CHAVE PIX', 'CPF, e-mail, telefone ou chave aleatória'],
] as const;

// O valor gravado é o nome do grupo da planilha; o rótulo é o que aparece na tela.
const GROUP_OPTIONS = [
    { value: 'ABATE 01', label: '1' },
    { value: 'ABATE 02', label: '2' },
    { value: '', label: 'Nenhum' },
];

const groupLabel = (value: string) => GROUP_OPTIONS.find((option) => option.value === value)?.label ?? value;

export default function GerenciadorFuncionarios() {
    const manager = useEmployeeManager();
    const toast = useToast();
    const [password, setPassword] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(null);
    // Ficha só para leitura até apertar "Editar"; cadastro novo já abre editável.
    const [editing, setEditing] = useState(false);

    const selectEmployee = (employee: IEmployee | 'new') => {
        manager.handleSelect(employee);
        setEditing(employee === 'new');
    };

    const cancelEdit = () => {
        if (manager.selectedId === 'new') {
            manager.setSelectedId(null);
        } else {
            const current = manager.employees.find((employee) => employee.id === manager.selectedId);
            if (current) manager.handleSelect(current);
        }
        setEditing(false);
    };

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
            const saveError = await manager.saveEmployee();
            if (saveError === null) {
                setEditing(false);
                toast.success('Funcionário salvo com sucesso!');
            } else {
                toast.error(`Erro ao salvar funcionário: ${saveError}`);
            }
        } else if (pendingAction === 'delete') {
            const deleteError = await manager.deleteEmployee();
            if (deleteError === null) {
                setEditing(false);
                toast.success('Funcionário excluído.');
            } else {
                toast.error(`Erro ao excluir funcionário: ${deleteError}`);
            }
        }
        setPendingAction(null);
    };

    const isNew = manager.selectedId === 'new';
    const groupSelectValue = GROUP_OPTIONS.some((option) => option.value === manager.formData.group_name)
        ? manager.formData.group_name
        : '';

    return (
        <PageLayout>
            <Sidebar>
                <div className={styles.sidebarTop}>
                    <HeaderInput
                        titulo="Funcionários"
                        setValor={manager.setSearchTerm}
                        valor={manager.searchTerm}
                        labelDescricao="Pesquise por nome, CPF, telefone ou grupo:"
                        placeholder="Digite para buscar..."
                    />
                </div>

                <nav className={styles.customerList}>
                    {manager.loading && !manager.selectedId ? (
                        <p className={styles.listMessage}>Carregando funcionários...</p>
                    ) : manager.filteredEmployees.length === 0 ? (
                        <p className={styles.listMessage}>Nenhum funcionário encontrado.</p>
                    ) : manager.filteredEmployees.map((employee) => (
                        <button
                            type="button"
                            key={employee.id}
                            className={`${styles.customerItem} ${manager.selectedId === employee.id ? styles.active : ''}`}
                            onClick={() => selectEmployee(employee)}
                        >
                            <span className={styles.itemName}>{employee.name}</span>
                            <span className={styles.itemDetails}>{employee.group_name || 'Sem grupo'}{employee.cpf ? ` · ${employee.cpf}` : ''}</span>
                        </button>
                    ))}
                </nav>

                <div className={styles.sidebarBottom}>
                    <button type="button" className={styles.btnAdd} onClick={() => selectEmployee('new')}>
                        + Novo Funcionário
                    </button>
                </div>
            </Sidebar>

            <Main className={styles.formArea}>
                {manager.selectedId ? (
                    <form onSubmit={requestSave} className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <div>
                                <span className={styles.eyebrow}>CADASTRO DE FUNCIONÁRIOS</span>
                                <h2>{isNew ? 'Novo funcionário' : editing ? 'Editar funcionário' : manager.formData.name || 'Funcionário'}</h2>
                                <p>
                                    {isNew
                                        ? 'Preencha os dados para criar um cadastro.'
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
                            {fields.map(([key, label, placeholder]) => {
                                const wide = key === 'name' || key === 'pix_key';
                                if (!editing) {
                                    const value = manager.formData[key];
                                    const shown = key === 'group_name' ? groupLabel(value) : value;
                                    return (
                                        <div key={key} className={wide ? styles.full : ''}>
                                            <span className={styles.label}>{label}</span>
                                            <p className={styles.viewValue}>{shown || '—'}</p>
                                        </div>
                                    );
                                }
                                if (key === 'group_name') {
                                    return (
                                        <div key={key}>
                                            <label className={styles.label} htmlFor="group_name">{label}</label>
                                            <select
                                                id="group_name"
                                                className={styles.input}
                                                value={groupSelectValue}
                                                onChange={(event) => manager.setFormData({ ...manager.formData, group_name: event.target.value })}
                                            >
                                                {GROUP_OPTIONS.map((option) => (
                                                    <option key={option.label} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={key} className={wide ? styles.full : ''}>
                                        <label className={styles.label} htmlFor={key}>{label}</label>
                                        <input
                                            id={key}
                                            className={`${styles.input} ${key === 'pix_key' ? styles.noCaps : ''}`}
                                            value={manager.formData[key]}
                                            onChange={(event) => manager.setFormData({ ...manager.formData, [key]: event.target.value })}
                                            placeholder={placeholder}
                                            required={key === 'name'}
                                        />
                                    </div>
                                );
                            })}

                            <div className={styles.full}>
                                <span className={styles.label}>OBS</span>
                                {editing ? (
                                    <textarea
                                        id="notes"
                                        className={styles.textarea}
                                        value={manager.formData.notes}
                                        onChange={(event) => manager.setFormData({ ...manager.formData, notes: event.target.value })}
                                        placeholder="Informações adicionais"
                                        rows={3}
                                    />
                                ) : (
                                    <p className={`${styles.viewValue} ${styles.viewMultiline}`}>{manager.formData.notes || '—'}</p>
                                )}
                            </div>
                        </div>

                        {editing ? (
                            <div className={styles.formActions}>
                                {!isNew && <button type="button" className={styles.btnDelete} onClick={requestDelete} disabled={manager.loading}>Excluir funcionário</button>}
                                <div className={styles.rightActions}>
                                    <button type="button" className={styles.btnCancel} onClick={cancelEdit}>Cancelar</button>
                                    <button type="submit" className={styles.btnSave} disabled={manager.loading}>{manager.loading ? 'Salvando...' : 'Salvar funcionário'}</button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.formActions}>
                                <button type="button" className={styles.btnDelete} onClick={requestDelete} disabled={manager.loading}>Excluir funcionário</button>
                                <div className={styles.rightActions}>
                                    <button type="button" className={styles.btnCancel} onClick={() => manager.setSelectedId(null)}>Fechar</button>
                                </div>
                            </div>
                        )}
                    </form>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>◌</div>
                        <h2>Cadastro de funcionários</h2>
                        <p>Selecione um funcionário na lista ou comece um novo cadastro.</p>
                        <button type="button" className={styles.btnSave} onClick={() => selectEmployee('new')}>Novo funcionário</button>
                    </div>
                )}
            </Main>

            {showModal && (
                <AdminPasswordModal
                    password={password}
                    setPassword={setPassword}
                    subtitle={pendingAction === 'save' ? 'Confirme a senha para salvar o funcionário' : 'Confirme a senha para realizar esta exclusão'}
                    onConfirm={confirmModal}
                    onCancel={cancelModal}
                />
            )}
        </PageLayout>
    );
}
