'use client';

import styles from './ControlPanel.module.css';
import { ITransaction } from '@/types';

interface ControlPanelProps {
    trans: ITransaction;
    shipping: number;
    setShipping: (val: number) => void;
    tax: number;
    setTax: (val: number) => void;
    isEditable: boolean;
    onUpdateStatus: (status: ITransaction['status']) => void;
    onGerarImagem: () => void;
    onRegistrarPagamento: () => void;
    setNewPayment: (val: number) => void;
}

export const ControlPanel = ({
    trans, shipping, setShipping, tax, setTax, isEditable,
    onUpdateStatus, onGerarImagem, onRegistrarPagamento, setNewPayment
}: ControlPanelProps) => {

    const handleTaxShortcut = () => {
        const calculatedTax = Number(trans.total_price) * 0.10;
        setTax(calculatedTax);
    };

    return (
        <section className={styles.panel}>

            <hr className={styles.divider} />

            {/* SEÇÃO DE CUSTOS ADICIONAIS */}
            {trans.status !== 'COBRADO' && trans.status !== 'CONCLUIDO' && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Custos Adicionais</h2>
                    <div className={styles.grid}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Logística (Frete R$)</label>
                            <input
                                type="number"
                                className={styles.field}
                                value={shipping}
                                onChange={e => setShipping(Number(e.target.value))}
                                disabled={!isEditable}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Taxas (R$)</label>
                            <div className={styles.inputWithShortcut}>
                                <input
                                    type="number"
                                    className={styles.field}
                                    value={tax}
                                    onChange={e => setTax(Number(e.target.value))}
                                    disabled={!isEditable}
                                />
                                {isEditable && (
                                    <button className={styles.shortcutBtn} onClick={handleTaxShortcut}>
                                        10%
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {isEditable && (
                        <button className={styles.btnSave} onClick={() => onUpdateStatus('ENVIADO')}>
                            Salvar e Finalizar Custos
                        </button>
                    )}
                </div>
            )}

            {/* SEÇÃO DE AÇÕES E DOWNLOAD */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Documentação</h2>
                {trans.status !== 'PENDENTE' && (
                    <button
                        className={`${styles.btnDownload} ${trans.status !== 'ENVIADO' ? styles.btnOutline : ''}`}
                        onClick={onGerarImagem}
                    >
                        {trans.status === 'CONCLUIDO' ? '🖼️ Baixar Recibo Final' : '🖼️ Baixar Comprovante Visual'}
                    </button>
                )}
            </div>

            {/* SEÇÃO FINANCEIRA (REGISTRO DE PAGAMENTO) */}
            {trans.status === 'COBRADO' && (
                <div className={styles.paymentCard}>
                    <h2 className={styles.paymentTitle}>Registrar Recebimento</h2>
                    <p className={styles.paymentDesc}>Insira o valor pago pelo cliente para atualizar o saldo.</p>

                    <div className={styles.paymentRow}>
                        <input
                            type="number"
                            className={styles.field}
                            placeholder="Valor R$"
                            onChange={e => setNewPayment(Number(e.target.value))}
                        />
                        <button className={styles.btnConfirm} onClick={onRegistrarPagamento}>
                            Confirmar
                        </button>
                    </div>
                </div>
            )}

            {/* FEEDBACK FINAL */}
            {trans.status === 'CONCLUIDO' && (
                <div className={styles.successBox}>
                    <span className={styles.checkIcon}>✅</span>
                    <div>
                        <p className={styles.successTitle}>Pagamento Concluído</p>
                        <p className={styles.successDesc}>Esta transação foi totalmente liquidada.</p>
                    </div>
                </div>
            )}
        </section>
    );
};