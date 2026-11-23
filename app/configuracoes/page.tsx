'use client';

import { useState, type KeyboardEvent } from 'react';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import AdminPasswordModal from '@/components/AdminPasswordModal/AdminPasswordModal';
import { PageLayout, Sidebar, Main, PageHeader, PageState } from '@/components/PageLayout/PageLayout';
import { useToast } from '@/components/Toast/Toast';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { verifyAdminPassword } from '@/utils/adminAuth';
import type { Configuracoes } from '@/utils/configuracoes';
import { parseValor } from '@/utils/diarias';
import styles from './page.module.css';

interface Rascunho {
    empresas: string[];
    bancos: string[];
    dias: string;
    desconto: string;
    acrescimo: string;
}

const formatarNumero = (numero: number) => String(numero).replace('.', ',');

// Converte o que está nos campos em configurações. Devolve a mensagem de erro se algum campo estiver inválido.
function rascunhoParaConfig(rascunho: Rascunho): Configuracoes | string {
    if (!/^\d+$/.test(rascunho.dias.trim())) return 'Dias de "vence em breve" deve ser um número inteiro.';

    const desconto = parseValor(rascunho.desconto);
    if (typeof desconto !== 'number') return 'Desconto do frango inválido.';

    const acrescimo = parseValor(rascunho.acrescimo);
    if (typeof acrescimo !== 'number') return 'Acréscimo por kg inválido.';

    return {
        empresas: rascunho.empresas,
        bancos: rascunho.bancos,
        diasVenceEmBreve: Number(rascunho.dias.trim()),
        descontoFrango: desconto,
        acrescimoFreteKg: acrescimo,
    };
}

interface EditorListaProps {
    titulo: string;
    placeholder: string;
    itens: string[];
    onChange: (itens: string[]) => void;
}

// Lista de textos com campo para adicionar e botão para remover. Nomes sempre em maiúsculas, sem repetir.
function EditorLista({ titulo, placeholder, itens, onChange }: EditorListaProps) {
    const [texto, setTexto] = useState('');

    const adicionar = () => {
        const nome = texto.trim().toUpperCase();
        if (!nome || itens.includes(nome)) return;
        onChange([...itens, nome]);
        setTexto('');
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            adicionar();
        }
    };

    return (
        <div className={styles.campo}>
            <span className={styles.label}>{titulo.toUpperCase()}</span>
            <div className={styles.addRow}>
                <input
                    className={styles.input}
                    value={texto}
                    onChange={(event) => setTexto(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                />
                <button type="button" className={styles.btnAdd} onClick={adicionar}>Adicionar</button>
            </div>
            {itens.length === 0 ? (
                <p className={styles.vazio}>Nenhum item cadastrado.</p>
            ) : (
                <ul className={styles.chipList}>
                    {itens.map((item) => (
                        <li key={item} className={styles.chip}>
                            <span>{item}</span>
                            <button
                                type="button"
                                className={styles.chipRemove}
                                onClick={() => onChange(itens.filter((atual) => atual !== item))}
                                aria-label={`Remover ${item}`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Só monta o formulário quando a configuração já carregou, então o rascunho começa com os valores do banco.
function FormConfiguracoes({ config }: { config: Configuracoes }) {
    const { salvar } = useConfiguracoes();
    const toast = useToast();
    const [rascunho, setRascunho] = useState<Rascunho>({
        empresas: config.empresas,
        bancos: config.bancos,
        dias: String(config.diasVenceEmBreve),
        desconto: formatarNumero(config.descontoFrango),
        acrescimo: formatarNumero(config.acrescimoFreteKg),
    });
    const [pendente, setPendente] = useState<Configuracoes | null>(null);
    const [password, setPassword] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const atualizar = (campo: Partial<Rascunho>) => setRascunho((atual) => ({ ...atual, ...campo }));

    // Valida antes de pedir a senha: não incomoda o admin para salvar algo que vai ser recusado.
    const requestSave = (event: React.FormEvent) => {
        event.preventDefault();
        const novo = rascunhoParaConfig(rascunho);
        if (typeof novo === 'string') {
            toast.error(novo);
            return;
        }
        setPendente(novo);
        setShowModal(true);
    };

    const cancelModal = () => {
        setShowModal(false);
        setPassword('');
    };

    const confirmSave = async () => {
        const ok = await verifyAdminPassword(password);
        if (!ok) {
            toast.error('Senha de administrador incorreta!');
            return;
        }
        setShowModal(false);
        setPassword('');
        if (!pendente) return;

        setSalvando(true);
        const erro = await salvar(pendente);
        setSalvando(false);
        if (erro === null) {
            toast.success('Configurações salvas.');
        } else {
            toast.error(`Erro ao salvar configurações: ${erro}`);
        }
    };

    return (
        <>
            <form onSubmit={requestSave} className={styles.card}>
                <section className={styles.secao}>
                    <h2>Boletos</h2>
                    <p>Listas que aparecem nos campos de empresa e de banco do pagamento.</p>
                    <EditorLista
                        titulo="Empresas"
                        placeholder="Nome da empresa"
                        itens={rascunho.empresas}
                        onChange={(empresas) => atualizar({ empresas })}
                    />
                    <EditorLista
                        titulo="Bancos do pagamento"
                        placeholder="Nome do banco"
                        itens={rascunho.bancos}
                        onChange={(bancos) => atualizar({ bancos })}
                    />
                    <div className={styles.campo}>
                        <label className={styles.label} htmlFor="dias-vence-em-breve">DIAS PARA VENCE EM BREVE</label>
                        <input
                            id="dias-vence-em-breve"
                            className={styles.input}
                            inputMode="numeric"
                            value={rascunho.dias}
                            onChange={(event) => atualizar({ dias: event.target.value })}
                        />
                        <p className={styles.dica}>Boleto que vence de hoje até esse número de dias aparece como &ldquo;Vence em breve&rdquo;.</p>
                    </div>
                </section>

                <section className={styles.secao}>
                    <h2>Funcionários</h2>
                    <div className={styles.campo}>
                        <label className={styles.label} htmlFor="desconto-frango">DESCONTO DE QUEM RECEBEU FRANGO (R$)</label>
                        <input
                            id="desconto-frango"
                            className={styles.input}
                            inputMode="decimal"
                            value={rascunho.desconto}
                            onChange={(event) => atualizar({ desconto: event.target.value })}
                        />
                        <p className={styles.dica}>Descontado do total do dia de quem está presente e recebeu frango.</p>
                    </div>
                </section>

                <section className={styles.secao}>
                    <h2>Cobrança</h2>
                    <div className={styles.campo}>
                        <label className={styles.label} htmlFor="acrescimo-frete">ACRÉSCIMO POR KG NO FRETE (R$)</label>
                        <input
                            id="acrescimo-frete"
                            className={styles.input}
                            inputMode="decimal"
                            value={rascunho.acrescimo}
                            onChange={(event) => atualizar({ acrescimo: event.target.value })}
                        />
                        <p className={styles.dica}>Frete = kg da LATAM × (taxa por kg + acréscimo).</p>
                    </div>
                </section>

                <div className={styles.acoes}>
                    <button type="submit" className={styles.btnSave} disabled={salvando}>
                        {salvando ? 'Salvando...' : 'Salvar configurações'}
                    </button>
                </div>
            </form>

            {showModal && (
                <AdminPasswordModal
                    password={password}
                    setPassword={setPassword}
                    subtitle="Confirme a senha para salvar as configurações"
                    onConfirm={confirmSave}
                    onCancel={cancelModal}
                />
            )}
        </>
    );
}

export default function Configuracoes() {
    const { config, error } = useConfiguracoes();

    return (
        <PageLayout>
            <Sidebar>
                <HeaderPadrao titulo="Configurações" />
            </Sidebar>

            <Main>
                <PageHeader
                    title="Configurações do sistema"
                    subtitle="Listas e valores usados nos cálculos e nos campos do sistema. Salvar pede a senha de administrador."
                />
                <div className={styles.conteudo}>
                    {config ? (
                        <FormConfiguracoes config={config} />
                    ) : (
                        <PageState kind={error ? 'error' : 'loading'} message={error ?? 'Carregando configurações...'} />
                    )}
                </div>
            </Main>
        </PageLayout>
    );
}
