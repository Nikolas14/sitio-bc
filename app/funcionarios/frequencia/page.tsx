'use client';

import { useState } from 'react';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useToast } from '@/components/Toast/Toast';
import { useEmployeeManager } from '@/hooks/useEmployeeManager';
import { useAttendanceDay } from '@/hooks/useAttendance';
import { formatLongDate, todayISO } from '@/utils/dates';
import { employeeGroupText } from '@/utils/employeeGroups';
import styles from '../funcionarios.module.css';

type AbateFilter = 'todos' | 'frango' | 'boi';

const ABATE_FILTERS: { value: AbateFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'frango', label: 'Frango' },
    { value: 'boi', label: 'Boi' },
];

export default function FrequenciaFuncionarios() {
    const manager = useEmployeeManager();
    const toast = useToast();
    const [workDate, setWorkDate] = useState(todayISO);
    const [abateFilter, setAbateFilter] = useState<AbateFilter>('todos');
    const attendance = useAttendanceDay(workDate);

    // Quem está na lista de chamada do dia.
    const onList = manager.employees.filter((employee) => attendance.entryOf(employee.id).confirmed);
    const presentes = onList.filter((employee) => attendance.presentOf(employee.id) === true).length;
    const faltas = onList.filter((employee) => attendance.presentOf(employee.id) === false).length;
    const receberam = onList.filter((employee) => attendance.entryOf(employee.id).receivedChicken).length;

    const rows = manager.filteredEmployees.filter((employee) => {
        const entry = attendance.entryOf(employee.id);
        if (!entry.confirmed) return false;
        return abateFilter === 'todos' || entry[abateFilter];
    });

    const handleSave = async () => {
        const saveError = await attendance.save();
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
                        <span className={styles.fieldLabel}>Abate</span>
                        <div className={styles.chipGroup}>
                            {ABATE_FILTERS.map((filter) => (
                                <button
                                    key={filter.value}
                                    type="button"
                                    className={`${styles.chip} ${abateFilter === filter.value ? styles.chipActive : ''}`}
                                    onClick={() => setAbateFilter(filter.value)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.summaryBox}>
                        <div className={styles.summaryRow}><span>Na lista</span><strong>{onList.length}</strong></div>
                        <div className={styles.summaryRow}><span>Presentes</span><strong>{presentes}</strong></div>
                        <div className={styles.summaryRow}><span>Faltas</span><strong>{faltas}</strong></div>
                        <div className={styles.summaryRow}><span>Receberam frango</span><strong>{receberam}</strong></div>
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
                        Quem está na lista de chamada aparece aqui. Marque Falta para quem não foi. Clique de novo para desfazer.
                    </p>

                    {manager.loading || attendance.loading ? (
                        <p className={styles.listMessage}>Carregando lista...</p>
                    ) : onList.length === 0 ? (
                        <p className={styles.listMessage}>Ninguém na lista deste dia. Monte a lista em Lista de chamada.</p>
                    ) : rows.length === 0 ? (
                        <p className={styles.listMessage}>Nenhum funcionário encontrado neste filtro.</p>
                    ) : (
                        <div className={styles.rollList}>
                            {rows.map((employee) => {
                                const entry = attendance.entryOf(employee.id);
                                const status = attendance.presentOf(employee.id);
                                return (
                                    <div key={employee.id} className={styles.rollRow}>
                                        <div className={styles.rollInfo}>
                                            <span className={styles.rollName}>{employee.name}</span>
                                            <span className={styles.rollMeta}>{employeeGroupText(employee.group_name)}</span>
                                            <div>
                                                {entry.frango && <span className={styles.badgeConfirmed}>Frango</span>}{' '}
                                                {entry.boi && <span className={styles.badgeConfirmed}>Boi</span>}
                                            </div>
                                        </div>
                                        <div className={styles.toggleGroup}>
                                            {entry.frango && status === true ? (
                                                <button
                                                    type="button"
                                                    className={`${styles.toggle} ${styles.toggleConfirm} ${entry.receivedChicken ? styles.on : ''}`}
                                                    onClick={() => attendance.setReceivedChicken(employee.id, !entry.receivedChicken)}
                                                    disabled={attendance.saving}
                                                >
                                                    Recebeu frango
                                                </button>
                                            ) : (
                                                <span className={styles.toggleSpacer} aria-hidden="true" />
                                            )}
                                            <button
                                                type="button"
                                                className={`${styles.toggle} ${styles.toggleAbsent} ${status === false ? styles.on : ''}`}
                                                onClick={() => attendance.setPresent(employee.id, false)}
                                                disabled={attendance.saving}
                                            >
                                                Falta
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.toggle} ${styles.togglePresent} ${status === true ? styles.on : ''}`}
                                                onClick={() => attendance.setPresent(employee.id, true)}
                                                disabled={attendance.saving}
                                            >
                                                Presente
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
