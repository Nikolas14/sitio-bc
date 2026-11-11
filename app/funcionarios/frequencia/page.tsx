'use client';

import { useEffect, useState } from 'react';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useToast } from '@/components/Toast/Toast';
import { useEmployeeManager } from '@/hooks/useEmployeeManager';
import { useAttendanceDay } from '@/hooks/useAttendance';
import { formatLongDate, todayISO } from '@/utils/dates';
import { DESCONTO_FRANGO, calcularPagamento, formatReais, parseValor } from '@/utils/diarias';
import { employeeGroupText } from '@/utils/employeeGroups';
import styles from '../funcionarios.module.css';

type AbateFilter = 'todos' | 'frango' | 'boi';

const ABATE_FILTERS: { value: AbateFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'frango', label: 'Frango' },
    { value: 'boi', label: 'Boi' },
];

// Cada página impressa tem 30 linhas; as que faltam ficam em branco.
const PRINT_ROWS_PER_PAGE = 30;

export default function FrequenciaFuncionarios() {
    const manager = useEmployeeManager();
    const toast = useToast();
    const [workDate, setWorkDate] = useState(todayISO);
    const [abateFilter, setAbateFilter] = useState<AbateFilter>('todos');
    const attendance = useAttendanceDay(workDate);

    // Valores das diárias digitados na hora. Não são gravados.
    const [textoFrango, setTextoFrango] = useState('');
    const [textoBoi, setTextoBoi] = useState('');
    const valorFrango = parseValor(textoFrango);
    const valorBoi = parseValor(textoBoi);
    const diariasValidas = valorFrango !== undefined && valorBoi !== undefined;
    const valores = { frango: valorFrango ?? 0, boi: valorBoi ?? 0 };

    // Extras por funcionário, digitados na hora. Não são gravados. Somam ao total, presente ou não.
    const [extras, setExtras] = useState<Record<string, string>>({});
    const extraDe = (employeeId: string) => parseValor(extras[employeeId] ?? '', true) ?? 0;

    // Quem está na lista de chamada do dia.
    const onList = manager.employees.filter((employee) => attendance.entryOf(employee.id).confirmed);
    const presentes = onList.filter((employee) => attendance.presentOf(employee.id) === true).length;
    const faltas = onList.filter((employee) => attendance.presentOf(employee.id) === false).length;
    const receberam = onList.filter((employee) => attendance.entryOf(employee.id).receivedChicken).length;

    // Pagamento do dia: diárias de quem foi, menos o desconto de quem recebeu frango.
    const pagamentoDe = (employeeId: string) =>
        calcularPagamento(attendance.presentOf(employeeId) === true, attendance.entryOf(employeeId), valores, extraDe(employeeId));
    const totalAPagar = onList.reduce((soma, employee) => soma + pagamentoDe(employee.id).total, 0);
    const totalDescontos = onList.reduce((soma, employee) => soma + pagamentoDe(employee.id).desconto, 0);
    const totalExtras = onList.reduce((soma, employee) => soma + pagamentoDe(employee.id).extra, 0);

    const rows = manager.filteredEmployees.filter((employee) => {
        const entry = attendance.entryOf(employee.id);
        if (!entry.confirmed) return false;
        return abateFilter === 'todos' || entry[abateFilter];
    });

    // Relatório impresso para pagamento: todos da lista do dia.
    const [imprimindo, setImprimindo] = useState(false);
    // Só quem foi (presente). Quem faltou não entra no relatório.
    const printLinhas = onList
        .filter((employee) => attendance.presentOf(employee.id) === true)
        .map((employee) => {
            const entry = attendance.entryOf(employee.id);
            const presente = attendance.presentOf(employee.id);
            const pagamento = calcularPagamento(presente === true, entry, valores, extraDe(employee.id));
            return { employee, entry, presente, pagamento };
        });
    const totalImpresso = printLinhas.reduce((soma, linha) => soma + linha.pagamento.total, 0);
    const printColunas = [
        'Nº',
        'Nome',
        'Abate',
        'Presença',
        'Recebeu frango',
        'Total',
        'Pix',
        'Obs',
    ];
    const printValoresDaLinha = (linha: (typeof printLinhas)[number], numero: number) => {
        const { employee, entry, presente, pagamento } = linha;
        const abate = entry.frango && entry.boi ? 'Frango e Boi' : entry.frango ? 'Frango' : 'Boi';
        const presenca = presente === true ? 'Presente' : presente === false ? 'Falta' : '—';
        return [
            String(numero),
            employee.name,
            abate,
            presenca,
            entry.frango ? (entry.receivedChicken ? 'Sim' : 'Não') : '',
            formatReais(pagamento.total),
            employee.pix_key || '',
            employee.notes || '',
        ];
    };

    // Cada página impressa tem 30 linhas; as que faltam ficam em branco.
    const printPages = Array.from(
        { length: Math.max(1, Math.ceil(printLinhas.length / PRINT_ROWS_PER_PAGE)) },
        (_, pageIndex) => Array.from(
            { length: PRINT_ROWS_PER_PAGE },
            (__, rowIndex) => printLinhas[pageIndex * PRINT_ROWS_PER_PAGE + rowIndex] ?? null,
        ),
    );

    useEffect(() => {
        if (!imprimindo) return;
        const reset = () => setImprimindo(false);
        window.addEventListener('afterprint', reset);
        window.print();
        return () => window.removeEventListener('afterprint', reset);
    }, [imprimindo]);

    const handleSave = async () => {
        const saveError = await attendance.save();
        if (saveError === null) toast.success('Frequência salva!');
        else toast.error(`Erro ao salvar frequência: ${saveError}`);
    };

    return (
        <>
        <PageLayout className={styles.screenOnly}>
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

                    <div>
                        <span className={styles.fieldLabel}>Valor da diária (R$)</span>
                        <div className={styles.diariaGrid}>
                            <label className={styles.diariaField}>
                                <span className={styles.fieldLabel}>Frango</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0,00"
                                    className={styles.diariaInput}
                                    value={textoFrango}
                                    onChange={(e) => setTextoFrango(e.target.value)}
                                />
                            </label>
                            <label className={styles.diariaField}>
                                <span className={styles.fieldLabel}>Boi</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0,00"
                                    className={styles.diariaInput}
                                    value={textoBoi}
                                    onChange={(e) => setTextoBoi(e.target.value)}
                                />
                            </label>
                        </div>
                        {!diariasValidas && <span className={styles.diariaError}>Use números, por exemplo 150,00.</span>}
                    </div>

                    <div className={styles.summaryBox}>
                        <div className={styles.summaryRow}><span>Na lista</span><strong>{onList.length}</strong></div>
                        <div className={styles.summaryRow}><span>Presentes</span><strong>{presentes}</strong></div>
                        <div className={styles.summaryRow}><span>Faltas</span><strong>{faltas}</strong></div>
                        <div className={styles.summaryRow}><span>Receberam frango</span><strong>{receberam}</strong></div>
                        <div className={styles.summaryRow}><span>Descontos (frango)</span><strong>{formatReais(totalDescontos)}</strong></div>
                        <div className={styles.summaryRow}><span>Extras</span><strong>{formatReais(totalExtras)}</strong></div>
                        <div className={styles.summaryRow}><span>Total a pagar</span><strong>{formatReais(totalAPagar)}</strong></div>
                    </div>
                </div>

                <div className={styles.sidebarBottom}>
                    <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={attendance.loading || attendance.saving}>
                        {attendance.saving ? 'Salvando...' : 'Salvar frequência'}
                    </button>
                    <button type="button" className={styles.btnPrintWide} onClick={() => setImprimindo(true)} disabled={onList.length === 0}>
                        Imprimir relatório
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
                                const pagamento = pagamentoDe(employee.id);
                                const extraTexto = extras[employee.id] ?? '';
                                const extraValido = parseValor(extraTexto, true) !== undefined;
                                return (
                                    <div key={employee.id} className={styles.rollRow}>
                                        <div className={styles.rollInfo}>
                                            <span className={styles.rollName}>{employee.name}</span>
                                            <span className={styles.rollMeta}>{employeeGroupText(employee.group_name)}</span>
                                            <div>
                                                {entry.frango && <span className={styles.badgeConfirmed}>Frango</span>}{' '}
                                                {entry.boi && <span className={styles.badgeConfirmed}>Boi</span>}
                                            </div>
                                            <label className={styles.extraField}>
                                                <span className={styles.fieldLabel}>Extra (R$)</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="0,00"
                                                    className={`${styles.extraInput} ${extraValido ? '' : styles.extraInputInvalid}`}
                                                    value={extraTexto}
                                                    onChange={(e) => setExtras((prev) => ({ ...prev, [employee.id]: e.target.value }))}
                                                />
                                            </label>
                                            {(status === true || pagamento.extra !== 0) && (
                                                <span className={styles.rollTotal}>
                                                    Total {formatReais(pagamento.total)}
                                                    {pagamento.desconto > 0 && (
                                                        <span className={styles.rollMeta}> · desc. frango {formatReais(DESCONTO_FRANGO)}</span>
                                                    )}
                                                    {pagamento.extra !== 0 && (
                                                        <span className={styles.rollMeta}> · extra {formatReais(pagamento.extra)}</span>
                                                    )}
                                                </span>
                                            )}
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

        <div className={styles.printSheet}>
            {printPages.map((paginaLinhas, pageIndex) => (
                <section key={pageIndex} className={styles.printPage}>
                    <h1 className={styles.printTitle}>Frequência · Pagamento do dia</h1>
                    <p className={styles.printMeta}>
                        {formatLongDate(workDate)} · Página {pageIndex + 1} de {printPages.length} · Pessoas: {printLinhas.length} · Total a pagar: {formatReais(totalImpresso)}
                    </p>
                    <p className={styles.printMeta}>
                        Diárias: frango {formatReais(valores.frango)} · boi {formatReais(valores.boi)} · desconto de quem recebeu frango: {formatReais(DESCONTO_FRANGO)}
                    </p>
                    <table className={`${styles.printTable} ${styles.printReport}`}>
                        <thead>
                            <tr>
                                {printColunas.map((coluna) => <th key={coluna}>{coluna}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {paginaLinhas.map((linha, rowIndex) => {
                                const numero = pageIndex * PRINT_ROWS_PER_PAGE + rowIndex + 1;
                                const celulas = linha ? printValoresDaLinha(linha, numero) : printColunas.map(() => '');
                                return (
                                    <tr key={rowIndex}>
                                        {celulas.map((celula, cellIndex) => <td key={cellIndex}>{celula}</td>)}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            ))}
        </div>
        </>
    );
}
