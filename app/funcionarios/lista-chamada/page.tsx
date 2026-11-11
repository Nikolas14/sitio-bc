'use client';

import { useEffect, useMemo, useState } from 'react';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import SearchSelect, { normalize } from '@/components/SearchSelect/SearchSelect';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useToast } from '@/components/Toast/Toast';
import { useEmployeeManager } from '@/hooks/useEmployeeManager';
import { useConfirmationList, AbateKind, AbateKinds } from '@/hooks/useConfirmationList';
import { formatLongDate, todayISO } from '@/utils/dates';
import { employeeGroupText } from '@/utils/employeeGroups';
import type { IEmployee } from '@/types';
import styles from '../funcionarios.module.css';

const NO_KINDS: AbateKinds = { frango: false, boi: false };

type PrintKind = 'todos' | AbateKind;
const PRINT_ROWS_PER_PAGE = 30;
const PRINT_TITLES: Record<PrintKind, string> = {
    todos: 'Todos os abates',
    frango: 'Dia do frango',
    boi: 'Dia do boi',
};


const matchesEmployee = (employee: IEmployee, query: string) =>
    [employee.name, employee.cpf, employee.phone, employee.group_name]
        .some((value) => normalize(value || '').includes(query));

export default function ListaChamadaFuncionarios() {
    const manager = useEmployeeManager();
    const toast = useToast();
    const [workDate, setWorkDate] = useState(todayISO);
    const list = useConfirmationList(workDate);

    // Pessoa escolhida na busca, ainda fora da lista, e os abates em que vai.
    const [pending, setPending] = useState<IEmployee | null>(null);
    const [pendingKinds, setPendingKinds] = useState<AbateKinds>(NO_KINDS);

    // Lista em ordem alfabética: quem já está na lista do dia.
    const confirmed = useMemo(
        () => manager.employees
            .filter((employee) => list.confirmedIds.includes(employee.id))
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
        [manager.employees, list.confirmedIds],
    );

    // Quem ainda não está na lista, para a busca.
    const candidates = useMemo(
        () => manager.employees.filter((employee) => !list.confirmedIds.includes(employee.id)),
        [manager.employees, list.confirmedIds],
    );

    const frangoCount = confirmed.filter((employee) => list.kindsOf(employee.id).frango).length;
    const boiCount = confirmed.filter((employee) => list.kindsOf(employee.id).boi).length;

    // Frango e boi já vêm marcados: desmarca o que a pessoa não confirmou.
    const handleSelectPending = (employee: IEmployee | null) => {
        setPending(employee);
        setPendingKinds(employee ? { frango: true, boi: true } : NO_KINDS);
    };

    const handleAdd = async () => {
        if (!pending) return;
        const error = await list.addEmployee(pending.id, pendingKinds);
        if (error) {
            toast.error(`Erro ao adicionar ${pending.name}: ${error}`);
            return;
        }
        handleSelectPending(null);
    };

    const handlePendingKind = (kind: AbateKind, value: boolean) => {
        setPendingKinds((prev) => ({ ...prev, [kind]: value }));
    };

    const handleToggle = async (employee: IEmployee, kind: AbateKind) => {
        const error = await list.setPersonKind(employee.id, kind, !list.kindsOf(employee.id)[kind]);
        if (error) toast.error(`Erro ao atualizar ${employee.name}: ${error}`);
    };

    const handleRemove = async (employee: IEmployee) => {
        const error = await list.removeEmployee(employee.id);
        if (error) toast.error(`Erro ao remover ${employee.name}: ${error}`);
    };

    const handleClear = async () => {
        if (!window.confirm('Zerar a lista deste dia? Todos saem da lista. A frequência já lançada é mantida.')) return;
        const error = await list.clearList();
        if (error === null) toast.success('Lista zerada.');
        else toast.error(`Erro ao zerar a lista: ${error}`);
    };

    // Impressão: a folha fica no DOM (escondida na tela) e o print usa só a lista escolhida.
    const [printKind, setPrintKind] = useState<PrintKind | null>(null);
    const printRows = confirmed.filter((employee) => {
        const kind = printKind ?? 'todos';
        return kind === 'todos' || list.kindsOf(employee.id)[kind];
    });

    // Cada página impressa tem 30 linhas; as que faltam ficam em branco.
    const printActive: PrintKind = printKind ?? 'todos';
    const printPages = Array.from(
        { length: Math.max(1, Math.ceil(printRows.length / PRINT_ROWS_PER_PAGE)) },
        (_, pageIndex) => Array.from(
            { length: PRINT_ROWS_PER_PAGE },
            (__, rowIndex) => printRows[pageIndex * PRINT_ROWS_PER_PAGE + rowIndex] ?? null,
        ),
    );

    useEffect(() => {
        if (!printKind) return;
        const reset = () => setPrintKind(null);
        window.addEventListener('afterprint', reset);
        window.print();
        return () => window.removeEventListener('afterprint', reset);
    }, [printKind]);

    const canAdd = !!pending && (pendingKinds.frango || pendingKinds.boi) && !list.saving;

    return (
        <>
        <PageLayout className={styles.screenOnly}>
            <Sidebar>
                <div className={styles.sidebarTop}>
                    <HeaderPadrao titulo="Lista de chamada" />
                </div>

                <div className={styles.sidebarBody}>
                    <div>
                        <span className={styles.fieldLabel}>Data do abate</span>
                        <input
                            type="date"
                            className={styles.dateInput}
                            value={workDate}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setWorkDate(e.target.value);
                                    handleSelectPending(null);
                                }
                            }}
                        />
                    </div>

                    <div>
                        <span className={styles.fieldLabel}>Funcionário</span>
                        <SearchSelect
                            items={candidates}
                            selected={pending}
                            onSelect={handleSelectPending}
                            matches={matchesEmployee}
                            getKey={(employee) => employee.id}
                            getLabel={(employee) => employee.name}
                            renderOption={(employee) => (
                                <>
                                    <span>{employee.name}</span>
                                    <small>{employeeGroupText(employee.group_name)}{employee.cpf ? ` · ${employee.cpf}` : ''}</small>
                                </>
                            )}
                            placeholder="Buscar por nome, CPF ou telefone..."
                            emptyText="Funcionário não encontrado"
                            maxResults={candidates.length}
                            focusOnClear={false}
                            loading={manager.loading || list.loading}
                        />
                    </div>

                    <div>
                        <span className={styles.fieldLabel}>Vai em</span>
                        <div className={styles.checkGroup}>
                            <label className={styles.checkRow}>
                                <input
                                    type="checkbox"
                                    checked={pendingKinds.frango}
                                    disabled={!pending || list.saving}
                                    onChange={(e) => handlePendingKind('frango', e.target.checked)}
                                />
                                Frango
                            </label>
                            <label className={styles.checkRow}>
                                <input
                                    type="checkbox"
                                    checked={pendingKinds.boi}
                                    disabled={!pending || list.saving}
                                    onChange={(e) => handlePendingKind('boi', e.target.checked)}
                                />
                                Boi
                            </label>
                        </div>
                    </div>

                    <button type="button" className={styles.btnPrimary} onClick={handleAdd} disabled={!canAdd}>
                        Adicionar à lista
                    </button>

                    <div className={styles.summaryBox}>
                        <div className={styles.summaryRow}><span>Na lista</span><strong>{confirmed.length}</strong></div>
                        <div className={styles.summaryRow}><span>Frango</span><strong>{frangoCount}</strong></div>
                        <div className={styles.summaryRow}><span>Boi</span><strong>{boiCount}</strong></div>
                    </div>
                </div>

                <div className={styles.sidebarBottom}>
                    <button type="button" className={styles.btnClear} onClick={handleClear} disabled={confirmed.length === 0 || list.saving}>
                        Zerar lista
                    </button>
                </div>
            </Sidebar>

            <Main className={styles.mainArea}>
                <div className={styles.card}>
                    <span className={styles.eyebrow}>LISTA DE CHAMADA · WHATSAPP</span>
                    <h2 className={styles.pageTitle}>{formatLongDate(workDate)}</h2>
                    <p className={styles.pageSub}>
                        Marque em quais abates cada pessoa vai. Quem não vai em nenhum sai da lista.
                    </p>

                    <div className={styles.printBar}>
                        <button type="button" className={styles.btnPrint} onClick={() => setPrintKind('todos')} disabled={confirmed.length === 0}>
                            Imprimir tudo
                        </button>
                        <button type="button" className={styles.btnPrint} onClick={() => setPrintKind('frango')} disabled={frangoCount === 0}>
                            Imprimir frango
                        </button>
                        <button type="button" className={styles.btnPrint} onClick={() => setPrintKind('boi')} disabled={boiCount === 0}>
                            Imprimir boi
                        </button>
                    </div>

                    {manager.loading || list.loading ? (
                        <p className={styles.listMessage}>Carregando lista...</p>
                    ) : confirmed.length === 0 ? (
                        <p className={styles.listMessage}>Nenhum funcionário na lista. Escolha alguém na barra lateral e marque os abates.</p>
                    ) : (
                        <div className={styles.rollList}>
                            {confirmed.map((employee) => {
                                const kinds = list.kindsOf(employee.id);
                                return (
                                    <div key={employee.id} className={styles.rollRow}>
                                        <div className={styles.rollInfo}>
                                            <span className={styles.rollName}>{employee.name}</span>
                                            <span className={styles.rollMeta}>{employeeGroupText(employee.group_name)}</span>
                                        </div>
                                        <div className={styles.toggleGroup}>
                                            <button
                                                type="button"
                                                className={`${styles.toggle} ${styles.toggleConfirm} ${kinds.frango ? styles.on : ''}`}
                                                onClick={() => void handleToggle(employee, 'frango')}
                                                disabled={list.saving}
                                            >
                                                Frango
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.toggle} ${styles.toggleConfirm} ${kinds.boi ? styles.on : ''}`}
                                                onClick={() => void handleToggle(employee, 'boi')}
                                                disabled={list.saving}
                                            >
                                                Boi
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.btnRemove}
                                                onClick={() => void handleRemove(employee)}
                                                disabled={list.saving}
                                            >
                                                Remover
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

        <div className={styles.printSheet}>
            {printPages.map((rows, pageIndex) => (
                <section key={pageIndex} className={styles.printPage}>
                    <h1 className={styles.printTitle}>Lista de chamada · {PRINT_TITLES[printActive]}</h1>
                    <p className={styles.printMeta}>
                        {formatLongDate(workDate)} · Página {pageIndex + 1} de {printPages.length} · Total: {printRows.length}
                    </p>
                    <table className={styles.printTable}>
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Nome</th>
                                {printActive === 'frango' && <th className={styles.printCol}>Recebeu frango</th>}
                                <th className={styles.printCol}>Presença</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((employee, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{pageIndex * PRINT_ROWS_PER_PAGE + rowIndex + 1}</td>
                                    <td>{employee?.name ?? ''}</td>
                                    {printActive === 'frango' && <td className={styles.printCol}></td>}
                                    <td className={styles.printCol}></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ))}
        </div>
        </>
    );
}
