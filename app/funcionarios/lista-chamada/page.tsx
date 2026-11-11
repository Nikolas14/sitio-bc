'use client';

import { useState } from 'react';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useToast } from '@/components/Toast/Toast';
import { useEmployeeManager } from '@/hooks/useEmployeeManager';
import { useAttendanceDay } from '@/hooks/useAttendance';
import { formatLongDate, todayISO } from '@/utils/dates';
import { employeeGroupText, GROUP_FILTERS, matchesGroupFilter } from '@/utils/employeeGroups';
import styles from '../funcionarios.module.css';

export default function ListaChamadaFuncionarios() {
    const manager = useEmployeeManager();
    const toast = useToast();
    const [workDate, setWorkDate] = useState(todayISO);
    const [groupFilter, setGroupFilter] = useState('todos');
    const attendance = useAttendanceDay(workDate);

    const total = manager.employees.length;
    const confirmados = manager.employees.filter((e) => attendance.entryOf(e.id).confirmed).length;
    const semResposta = total - confirmados;
    const visible = manager.filteredEmployees.filter((e) => matchesGroupFilter(e.group_name, groupFilter));

    const handleSave = async () => {
        const saveError = await attendance.save('lista');
        if (saveError === null) toast.success('Lista de chamada salva!');
        else toast.error(`Erro ao salvar lista: ${saveError}`);
    };

    return (
        <PageLayout>
            <Sidebar>
                <div className={styles.sidebarTop}>
                    <HeaderInput
                        titulo="Lista de chamada"
                        setValor={manager.setSearchTerm}
                        valor={manager.searchTerm}
                        labelDescricao="Pesquise por nome, CPF, telefone ou grupo:"
                        placeholder="Digite para buscar..."
                    />
                </div>

                <div className={styles.sidebarBody}>
                    <div>
                        <span className={styles.fieldLabel}>Data do abate</span>
                        <input
                            type="date"
                            className={styles.dateInput}
                            value={workDate}
                            onChange={(e) => {
                                if (e.target.value) setWorkDate(e.target.value);
                            }}
                        />
                    </div>

                    <div>
                        <span className={styles.fieldLabel}>Grupo</span>
                        <div className={styles.chipGroup}>
                            {GROUP_FILTERS.map((filter) => (
                                <button
                                    key={filter.value}
                                    type="button"
                                    className={`${styles.chip} ${groupFilter === filter.value ? styles.chipActive : ''}`}
                                    onClick={() => setGroupFilter(filter.value)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.summaryBox}>
                        <div className={styles.summaryRow}><span>Confirmaram</span><strong>{confirmados}</strong></div>
                        <div className={styles.summaryRow}><span>Sem resposta</span><strong>{semResposta}</strong></div>
                        <div className={styles.summaryRow}><span>Total de funcionários</span><strong>{total}</strong></div>
                    </div>
                </div>

                <div className={styles.sidebarBottom}>
                    <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={attendance.loading || attendance.saving}>
                        {attendance.saving ? 'Salvando...' : 'Salvar lista de chamada'}
                    </button>
                </div>
            </Sidebar>

            <Main className={styles.mainArea}>
                <div className={styles.card}>
                    <span className={styles.eyebrow}>LISTA DE CHAMADA · WHATSAPP</span>
                    <h2 className={styles.pageTitle}>{formatLongDate(workDate)}</h2>
                    <p className={styles.pageSub}>
                        Marque quem confirmou presença no grupo. Depois, na tela Frequência, lance quem realmente foi.
                    </p>

                    {manager.loading || attendance.loading ? (
                        <p className={styles.listMessage}>Carregando funcionários...</p>
                    ) : visible.length === 0 ? (
                        <p className={styles.listMessage}>Nenhum funcionário encontrado.</p>
                    ) : (
                        <div className={styles.rollList}>
                            {visible.map((employee) => {
                                const confirmed = attendance.entryOf(employee.id).confirmed;
                                return (
                                    <div key={employee.id} className={styles.rollRow}>
                                        <div className={styles.rollInfo}>
                                            <span className={styles.rollName}>{employee.name}</span>
                                            <span className={styles.rollMeta}>{employeeGroupText(employee.group_name)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className={`${styles.toggle} ${styles.toggleConfirm} ${confirmed ? styles.on : ''}`}
                                            onClick={() => attendance.toggleConfirmed(employee.id)}
                                            disabled={attendance.saving}
                                        >
                                            {confirmed ? 'Confirmou' : 'Confirmar'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Main>
        </PageLayout>
    );
}
