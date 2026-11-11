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

export default function FrequenciaFuncionarios() {
    const manager = useEmployeeManager();
    const toast = useToast();
    const [workDate, setWorkDate] = useState(todayISO);
    const [groupFilter, setGroupFilter] = useState('todos');
    const attendance = useAttendanceDay(workDate);

    const total = manager.employees.length;
    const presentes = manager.employees.filter((e) => attendance.presentOf(e.id) === true).length;
    const faltas = manager.employees.filter((e) => attendance.presentOf(e.id) === false).length;
    const visible = manager.filteredEmployees.filter((e) => matchesGroupFilter(e.group_name, groupFilter));

    const handleSave = async () => {
        const saveError = await attendance.save('frequencia');
        if (saveError === null) toast.success('Frequência salva!');
        else toast.error(`Erro ao salvar frequência: ${saveError}`);
    };

    return (
        <PageLayout>
            <Sidebar>
                <div className={styles.sidebarTop}>
                    <HeaderInput
                        titulo="Frequência"
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
                        <div className={styles.summaryRow}><span>Presentes</span><strong>{presentes}</strong></div>
                        <div className={styles.summaryRow}><span>Faltas</span><strong>{faltas}</strong></div>
                        <div className={styles.summaryRow}><span>Total de funcionários</span><strong>{total}</strong></div>
                    </div>
                </div>

                <div className={styles.sidebarBottom}>
                    <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={attendance.loading || attendance.saving}>
                        {attendance.saving ? 'Salvando...' : 'Salvar frequência'}
                    </button>
                </div>
            </Sidebar>

            <Main className={styles.mainArea}>
                <div className={styles.card}>
                    <span className={styles.eyebrow}>FREQUÊNCIA REAL</span>
                    <h2 className={styles.pageTitle}>{formatLongDate(workDate)}</h2>
                    <p className={styles.pageSub}>
                        Quem confirmou entra como presente. Marque Falta para quem não foi. Clique de novo para desfazer.
                    </p>

                    {manager.loading || attendance.loading ? (
                        <p className={styles.listMessage}>Carregando funcionários...</p>
                    ) : visible.length === 0 ? (
                        <p className={styles.listMessage}>Nenhum funcionário encontrado.</p>
                    ) : (
                        <div className={styles.rollList}>
                            {visible.map((employee) => {
                                const entry = attendance.entryOf(employee.id);
                                const status = attendance.presentOf(employee.id);
                                return (
                                    <div key={employee.id} className={styles.rollRow}>
                                        <div className={styles.rollInfo}>
                                            <span className={styles.rollName}>{employee.name}</span>
                                            <span className={styles.rollMeta}>{employeeGroupText(employee.group_name)}</span>
                                            <span className={entry.confirmed ? styles.badgeConfirmed : styles.badgeMuted}>
                                                {entry.confirmed ? 'Confirmou no WhatsApp' : 'Não confirmou'}
                                            </span>
                                        </div>
                                        <div className={styles.toggleGroup}>
                                            <button
                                                type="button"
                                                className={`${styles.toggle} ${styles.togglePresent} ${status === true ? styles.on : ''}`}
                                                onClick={() => attendance.setPresent(employee.id, true)}
                                                disabled={attendance.saving}
                                            >
                                                Presente
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.toggle} ${styles.toggleAbsent} ${status === false ? styles.on : ''}`}
                                                onClick={() => attendance.setPresent(employee.id, false)}
                                                disabled={attendance.saving}
                                            >
                                                Falta
                                            </button>
                                        </div>
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
