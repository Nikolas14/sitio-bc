'use client';

import { useEffect, useState } from 'react';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useToast } from '@/components/Toast/Toast';
import { useEmployeeManager } from '@/hooks/useEmployeeManager';
import { fetchAttendanceWeek, fetchUltimaData, useAttendanceDay, type AttendanceWeekRow } from '@/hooks/useAttendance';
import type { AbateKind } from '@/hooks/useConfirmationList';
import { addDays, formatLongDate, formatShortDate, mondayOf, todayISO } from '@/utils/dates';
import { calcularPagamento, formatReais, parseValor } from '@/utils/diarias';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { employeeGroupText } from '@/utils/employeeGroups';
import styles from '../funcionarios.module.css';

// Cada página impressa tem 30 linhas; as que faltam ficam em branco.
const PRINT_ROWS_PER_PAGE = 30;

// P = presente, F = falta. Presença sem lançamento conta como presente (quem está na lista).
const marcaDoAbate = (presente: boolean | null) => (presente === false ? 'F' : 'P');

const ROTULO_ABATE: Record<AbateKind, string> = { frango: 'Frango', boi: 'Boi' };

export default function FrequenciaFuncionarios() {
    const manager = useEmployeeManager();
    const toast = useToast();
    const { config } = useConfiguracoes();
    const descontoFrango = config?.descontoFrango ?? 0;
    // Uma frequência por semana: a tela guarda uma data da semana e trabalha com a segunda-feira.
    const [workDate, setWorkDate] = useState(todayISO);
    // Ao abrir, a tela vai para a semana mais recente. Só carrega a frequência depois de saber a data.
    const [dataCarregada, setDataCarregada] = useState(false);
    const semanaInicio = mondayOf(workDate);
    const semanaFim = addDays(semanaInicio, 6);
    const attendance = useAttendanceDay(dataCarregada ? semanaInicio : null);

    useEffect(() => {
        let ativo = true;
        fetchUltimaData().then((ultima) => {
            if (!ativo) return;
            if (ultima) setWorkDate(ultima);
            setDataCarregada(true);
        });
        return () => {
            ativo = false;
        };
    }, []);

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

    // Presença em cada abate. Quem não está na lista daquele abate não entra na conta.
    const foiEm = (employeeId: string) => ({
        frango: attendance.presentOf(employeeId, 'frango') === true,
        boi: attendance.presentOf(employeeId, 'boi') === true,
    });

    // Quem está na lista de chamada da semana.
    const onList = manager.employees.filter((employee) => attendance.entryOf(employee.id).confirmed);
    const contarPresenca = (kind: AbateKind, presente: boolean) =>
        onList.filter((employee) => attendance.presentOf(employee.id, kind) === presente).length;
    const receberam = onList.filter((employee) => attendance.entryOf(employee.id).receivedChicken).length;

    // Pagamento da semana: diária de cada abate em que a pessoa foi, menos o desconto de quem recebeu frango.
    const pagamentoDe = (employeeId: string) =>
        calcularPagamento(foiEm(employeeId), attendance.entryOf(employeeId).receivedChicken, valores, extraDe(employeeId), descontoFrango);
    const totalAPagar = onList.reduce((soma, employee) => soma + pagamentoDe(employee.id).total, 0);
    const totalDescontos = onList.reduce((soma, employee) => soma + pagamentoDe(employee.id).desconto, 0);
    const totalExtras = onList.reduce((soma, employee) => soma + pagamentoDe(employee.id).extra, 0);

    const rows = manager.filteredEmployees.filter((employee) => attendance.entryOf(employee.id).confirmed);

    // Impressão: pagamento da semana ou frequência da semana. Uma por vez.
    const [impressao, setImpressao] = useState<'pagamento' | 'semana' | null>(null);
    const [semanaImpressa, setSemanaImpressa] = useState<AttendanceWeekRow[]>([]);

    // Uma linha por pessoa da lista da semana, com a marca de cada abate: P = presente, F = falta, — = não foi escalada.
    const linhasDaSemana = manager.employees.flatMap((employee) => {
        const row = semanaImpressa.find((r) => r.employee_id === employee.id && r.confirmed);
        if (!row) return [];
        const frango = row.frango ? marcaDoAbate(row.present_frango) : '—';
        const boi = row.boi ? marcaDoAbate(row.present_boi) : '—';
        const presencas = [frango, boi].filter((marca) => marca === 'P').length;
        return [{ employee, frango, boi, presencas }];
    });
    const semanaPages = Array.from(
        { length: Math.max(1, Math.ceil(linhasDaSemana.length / PRINT_ROWS_PER_PAGE)) },
        (_, pageIndex) => Array.from(
            { length: PRINT_ROWS_PER_PAGE },
            (__, rowIndex) => linhasDaSemana[pageIndex * PRINT_ROWS_PER_PAGE + rowIndex] ?? null,
        ),
    );

    // A semana é buscada na hora de imprimir, para pegar o que foi salvo nos dias.
    const imprimirSemana = async () => {
        const rows = await fetchAttendanceWeek(semanaInicio);
        if (rows === null) {
            toast.error('Erro ao carregar a semana para impressão');
            return;
        }
        setSemanaImpressa(rows);
        setImpressao('semana');
    };

    // Quem foi em pelo menos um abate. Quem faltou nos dois não entra no relatório.
    const printLinhas = onList.flatMap((employee) => {
        const foi = foiEm(employee.id);
        if (!foi.frango && !foi.boi) return [];
        const entry = attendance.entryOf(employee.id);
        const pagamento = pagamentoDe(employee.id);
        return [{ employee, entry, foi, pagamento }];
    });
    const totalImpresso = printLinhas.reduce((soma, linha) => soma + linha.pagamento.total, 0);
    const printColunas = [
        'Nº',
        'Nome',
        'Total',
        'Pix',
        'Obs',
        'Abate',
        'Recebeu frango',
    ];
    const printValoresDaLinha = (linha: (typeof printLinhas)[number], numero: number) => {
        const { employee, entry, foi, pagamento } = linha;
        const abate = foi.frango && foi.boi ? 'Frango e Boi' : foi.frango ? 'Frango' : 'Boi';
        return [
            String(numero),
            employee.name,
            formatReais(pagamento.total),
            employee.pix_key || '',
            employee.notes || '',
            abate,
            foi.frango ? (entry.receivedChicken ? 'Sim' : 'Não') : '',
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
        if (!impressao) return;
        const reset = () => setImpressao(null);
        window.addEventListener('afterprint', reset);
        window.print();
        return () => window.removeEventListener('afterprint', reset);
    }, [impressao]);

    const handleSave = async () => {
        const saveError = await attendance.save();
        if (saveError === null) toast.success('Frequência salva!');
        else toast.error(`Erro ao salvar frequência: ${saveError}`);
    };

    // Falta e Presente de um abate da pessoa.
    const botoesAbate = (employeeId: string, kind: AbateKind) => {
        const presente = attendance.presentOf(employeeId, kind);
        return (
            <div className={styles.abateRow}>
                <span className={styles.abateName}>{ROTULO_ABATE[kind]}</span>
                <button
                    type="button"
                    className={`${styles.toggle} ${styles.toggleAbsent} ${presente === false ? styles.on : ''}`}
                    onClick={() => attendance.setPresent(employeeId, kind, false)}
                    disabled={attendance.saving}
                >
                    Falta
                </button>
                <button
                    type="button"
                    className={`${styles.toggle} ${styles.togglePresent} ${presente === true ? styles.on : ''}`}
                    onClick={() => attendance.setPresent(employeeId, kind, true)}
                    disabled={attendance.saving}
                >
                    Presente
                </button>
            </div>
        );
    };

    const abatesDaSemana = [
        attendance.semana.frango ? 'Frango' : null,
        attendance.semana.boi ? 'Boi' : null,
    ].filter(Boolean).join(' e ') || 'nenhum';

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
                        <span className={styles.fieldLabel}>Semana</span>
                        <input
                            type="date"
                            className={styles.dateInput}
                            value={workDate}
                            onChange={(e) => {
                                if (e.target.value) setWorkDate(e.target.value);
                            }}
                        />
                        <span className={styles.fieldLabel}>De {formatShortDate(semanaInicio)} a {formatShortDate(semanaFim)}</span>
                        <span className={styles.fieldLabel}>Tem na semana: {abatesDaSemana}</span>
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
                        <div className={styles.summaryRow}><span>Presentes (frango · boi)</span><strong>{contarPresenca('frango', true)} · {contarPresenca('boi', true)}</strong></div>
                        <div className={styles.summaryRow}><span>Faltas (frango · boi)</span><strong>{contarPresenca('frango', false)} · {contarPresenca('boi', false)}</strong></div>
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
                    <button type="button" className={styles.btnPrintWide} onClick={imprimirSemana}>
                        Imprimir frequência da semana
                    </button>
                    <button type="button" className={styles.btnPrintWide} onClick={() => setImpressao('pagamento')} disabled={onList.length === 0}>
                        Imprimir pagamento da semana
                    </button>
                </div>
            </Sidebar>

            <Main className={styles.mainArea}>
                <div className={styles.card}>
                    <span className={styles.eyebrow}>FREQUÊNCIA REAL</span>
                    <h2 className={styles.pageTitle}>Semana de {formatLongDate(semanaInicio)}</h2>
                    <p className={styles.pageSub}>
                        Quem está na lista de chamada aparece aqui. Marque Falta em cada abate que a pessoa não foi. Clique de novo para desfazer.
                    </p>

                    {manager.loading || attendance.loading ? (
                        <p className={styles.listMessage}>Carregando lista...</p>
                    ) : onList.length === 0 ? (
                        <p className={styles.listMessage}>Ninguém na lista desta semana. Monte a lista em Lista de chamada.</p>
                    ) : rows.length === 0 ? (
                        <p className={styles.listMessage}>Nenhum funcionário encontrado nesta busca.</p>
                    ) : (
                        <div className={styles.rollList}>
                            {rows.map((employee) => {
                                const entry = attendance.entryOf(employee.id);
                                const foi = foiEm(employee.id);
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
                                            {(foi.frango || foi.boi || pagamento.extra !== 0) && (
                                                <span className={styles.rollTotal}>
                                                    Total {formatReais(pagamento.total)}
                                                    {pagamento.desconto > 0 && (
                                                        <span className={styles.rollMeta}> · desc. frango {formatReais(descontoFrango)}</span>
                                                    )}
                                                    {pagamento.extra !== 0 && (
                                                        <span className={styles.rollMeta}> · extra {formatReais(pagamento.extra)}</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.toggleGroup}>
                                            {entry.frango && foi.frango ? (
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
                                            <div className={styles.abateStack}>
                                                {entry.frango && botoesAbate(employee.id, 'frango')}
                                                {entry.boi && botoesAbate(employee.id, 'boi')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Main>
        </PageLayout>

        {impressao === 'pagamento' && (
        <div className={styles.printSheet}>
            {printPages.map((paginaLinhas, pageIndex) => (
                <section key={pageIndex} className={styles.printPage}>
                    <h1 className={styles.printTitle}>Frequência · Pagamento da semana</h1>
                    <p className={styles.printMeta}>
                        Semana de {formatShortDate(semanaInicio)} a {formatShortDate(semanaFim)} · Página {pageIndex + 1} de {printPages.length} · Pessoas: {printLinhas.length} · Total a pagar: {formatReais(totalImpresso)}
                    </p>
                    <p className={styles.printMeta}>
                        Diárias: frango {formatReais(valores.frango)} · boi {formatReais(valores.boi)} · desconto de quem recebeu frango: {formatReais(descontoFrango)}
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
        )}

        {impressao === 'semana' && (
        <div className={styles.printSheet}>
            {semanaPages.map((paginaLinhas, pageIndex) => (
                <section key={pageIndex} className={styles.printPage}>
                    <h1 className={styles.printTitle}>Frequência · Semana</h1>
                    <p className={styles.printMeta}>
                        Semana de {formatShortDate(semanaInicio)} a {formatShortDate(semanaFim)} · Página {pageIndex + 1} de {semanaPages.length} · Pessoas: {linhasDaSemana.length}
                    </p>
                    <p className={styles.printMeta}>
                        P = presente · F = falta · — = não estava neste abate
                    </p>
                    <table className={`${styles.printTable} ${styles.printReport} ${styles.printWeek}`}>
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Nome</th>
                                <th className={styles.printCentro}>Frango</th>
                                <th className={styles.printCentro}>Boi</th>
                                <th className={styles.printCentro}>Presenças</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginaLinhas.map((linha, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{linha ? pageIndex * PRINT_ROWS_PER_PAGE + rowIndex + 1 : ''}</td>
                                    <td>{linha?.employee.name ?? ''}</td>
                                    <td className={styles.printCentro}>{linha?.frango ?? ''}</td>
                                    <td className={styles.printCentro}>{linha?.boi ?? ''}</td>
                                    <td className={styles.printCentro}>{linha ? linha.presencas : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ))}
        </div>
        )}
        </>
    );
}
