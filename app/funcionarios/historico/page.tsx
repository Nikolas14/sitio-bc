'use client';

import { useState } from 'react';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useEmployeeManager } from '@/hooks/useEmployeeManager';
import { useEmployeeAttendance, type AttendanceHistoryRow } from '@/hooks/useAttendance';
import { formatShortDate } from '@/utils/dates';
import { employeeGroupText } from '@/utils/employeeGroups';
import styles from '../funcionarios.module.css';

// Os dois abates da semana: chave na linha, campo da presença e rótulo.
const ABATES = [
    { chave: 'frango', campo: 'present_frango', rotulo: 'Frango' },
    { chave: 'boi', campo: 'present_boi', rotulo: 'Boi' },
] as const;

export default function HistoricoFuncionarios() {
    const manager = useEmployeeManager();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selected = manager.employees.find((e) => e.id === selectedId) ?? null;
    const history = useEmployeeAttendance(selectedId);

    // Abates em que a pessoa estava na lista da semana.
    const abatesDaLinha = (row: AttendanceHistoryRow) => ABATES.filter((abate) => row[abate.chave]);
    const rotuloAbates = (row: AttendanceHistoryRow) => {
        const nomes = abatesDaLinha(row).map((abate) => abate.rotulo);
        return nomes.length === 0 ? 'Não' : nomes.join(' e ');
    };

    // Cada abate em que a pessoa estava vale uma presença ou uma falta.
    const lancamentos = history.rows.flatMap((row) => abatesDaLinha(row).map((abate) => row[abate.campo]));
    const confirmacoes = history.rows.filter((row) => row.confirmed).length;
    const presencas = lancamentos.filter((presente) => presente === true).length;
    const faltas = lancamentos.filter((presente) => presente === false).length;
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
                                <span className={styles.statLabel}>Semanas na lista</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{presencas} · {faltas}</span>
                                <span className={styles.statLabel}>Presenças · Faltas (por abate)</span>
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
                                        <th>Semana de</th>
                                        <th>Abates</th>
                                        <th>Situação</th>
                                        <th>Recebeu frango</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.rows.map((row) => (
                                        <tr key={row.work_date}>
                                            <td>{formatShortDate(row.work_date)}</td>
                                            <td>{rotuloAbates(row)}</td>
                                            <td>
                                                <div className={styles.pillGroup}>
                                                    {abatesDaLinha(row).length === 0 && '—'}
                                                    {abatesDaLinha(row).map((abate) => {
                                                        const presente = row[abate.campo];
                                                        const classe = presente === null ? styles.pillMuted : presente ? styles.pillPresent : styles.pillAbsent;
                                                        const texto = presente === null ? 'Sem lançamento' : presente ? 'Presente' : 'Falta';
                                                        return (
                                                            <span key={abate.chave} className={`${styles.pill} ${classe}`}>
                                                                {abate.rotulo}: {texto}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td>{row.frango ? (row.received_chicken ? 'Sim' : 'Não') : '—'}</td>
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
                        <p>Selecione um funcionário na lista para ver as semanas, as presenças por abate e o recebimento de frango.</p>
                    </div>
                )}
            </Main>
        </PageLayout>
    );
}
