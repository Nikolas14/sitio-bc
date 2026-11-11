'use client';

import { useState } from 'react';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useEmployeeManager } from '@/hooks/useEmployeeManager';
import { useEmployeeAttendance } from '@/hooks/useAttendance';
import { formatShortDate, weekdayOf } from '@/utils/dates';
import { employeeGroupText } from '@/utils/employeeGroups';
import styles from '../funcionarios.module.css';

export default function HistoricoFuncionarios() {
    const manager = useEmployeeManager();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selected = manager.employees.find((e) => e.id === selectedId) ?? null;
    const history = useEmployeeAttendance(selectedId);

    const confirmacoes = history.rows.filter((row) => row.confirmed).length;
    const presencas = history.rows.filter((row) => row.present === true).length;
    const faltas = history.rows.filter((row) => row.present === false).length;
    const lancadas = presencas + faltas;
    const percentual = lancadas > 0 ? Math.round((presencas / lancadas) * 100) : 0;

    return (
        <PageLayout>
            <Sidebar>
                <div className={styles.sidebarTop}>
                    <HeaderInput
                        titulo="Histórico"
                        setValor={manager.setSearchTerm}
                        valor={manager.searchTerm}
                        labelDescricao="Pesquise por nome, CPF, telefone ou grupo:"
                        placeholder="Digite para buscar..."
                    />
                </div>

                <nav className={styles.itemList}>
                    {manager.loading ? (
                        <p className={styles.listMessage}>Carregando funcionários...</p>
                    ) : manager.filteredEmployees.length === 0 ? (
                        <p className={styles.listMessage}>Nenhum funcionário encontrado.</p>
                    ) : manager.filteredEmployees.map((employee) => (
                        <button
                            type="button"
                            key={employee.id}
                            className={`${styles.listItem} ${selectedId === employee.id ? styles.active : ''}`}
                            onClick={() => setSelectedId(employee.id)}
                        >
                            <span className={styles.itemName}>{employee.name}</span>
                            <span className={styles.itemDetails}>{employeeGroupText(employee.group_name)}</span>
                        </button>
                    ))}
                </nav>
            </Sidebar>

            <Main className={styles.mainArea}>
                {selected ? (
                    <div className={styles.card}>
                        <span className={styles.eyebrow}>HISTÓRICO DE FREQUÊNCIA</span>
                        <h2 className={styles.pageTitle}>{selected.name}</h2>
                        <p className={styles.pageSub}>{employeeGroupText(selected.group_name)}</p>

                        <div className={styles.statGrid}>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{confirmacoes}</span>
                                <span className={styles.statLabel}>Confirmações</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{presencas} · {faltas}</span>
                                <span className={styles.statLabel}>Presenças · Faltas</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{percentual}%</span>
                                <span className={styles.statLabel}>Presença real</span>
                            </div>
                        </div>

                        {history.loading ? (
                            <p className={styles.listMessage}>Carregando histórico...</p>
                        ) : history.rows.length === 0 ? (
                            <p className={styles.listMessage}>Nenhuma chamada registrada para este funcionário.</p>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Dia</th>
                                        <th>Confirmou</th>
                                        <th>Situação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.rows.map((row) => (
                                        <tr key={row.work_date}>
                                            <td>{formatShortDate(row.work_date)}</td>
                                            <td className={styles.weekday}>{weekdayOf(row.work_date)}</td>
                                            <td>{row.confirmed ? 'Sim' : 'Não'}</td>
                                            <td>
                                                {row.present === null ? (
                                                    <span className={`${styles.pill} ${styles.pillMuted}`}>Sem lançamento</span>
                                                ) : (
                                                    <span className={`${styles.pill} ${row.present ? styles.pillPresent : styles.pillAbsent}`}>
                                                        {row.present ? 'Presente' : 'Falta'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>◌</div>
                        <h2>Histórico de frequência</h2>
                        <p>Selecione um funcionário na lista para ver as confirmações e presenças por data.</p>
                    </div>
                )}
            </Main>
        </PageLayout>
    );
}
