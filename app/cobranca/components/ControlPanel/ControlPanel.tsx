'use client';

import { useState, useEffect } from 'react';
import styles from './ControlPanel.module.css';
import { ITransaction } from '@/types';

interface FinancialSummary {
    sub: number;
    discountValue: number;
    final: number;
    paid: number;
    remaining: number;
}

interface ControlPanelProps {
    trans: ITransaction;
    shipping: number;
    setShipping: (val: number) => void;
    latamKg: number;
    setLatamKg: (val: number) => void;
    shippingRate: number;
    setShippingRate: (val: number) => void;
    tax: number;
    setTax: (val: number) => void;
    isEditable: boolean;
    onUpdateStatus: (status: ITransaction['status']) => void;
    onGerarImagem: () => void;
    onRegistrarPagamento: () => void;
    setNewPayment: (val: number) => void;
    loading: boolean;
    financial: FinancialSummary;

}

interface NumberFieldProps {
    value: number;
    onChange: (val: number) => void;
    disabled?: boolean;
}

// Mantém o texto digitado separado do número, para o "0" não ficar colado na frente do que for digitado
const NumberField = ({ value, onChange, disabled }: NumberFieldProps) => {
    const [draft, setDraft] = useState(value ? String(value) : '');

    useEffect(() => {
        setDraft(prev => (Number(prev) === value ? prev : value ? String(value) : ''));
    }, [value]);

    return (
        <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            className={styles.field}
            value={draft}
            onChange={e => {
                setDraft(e.target.value);
                onChange(Number(e.target.value));
            }}
            disabled={disabled}
        />
    );
};

export const ControlPanel = ({
    trans, shipping, setShipping, latamKg, setLatamKg, shippingRate, setShippingRate, tax, setTax, isEditable,
    onUpdateStatus, onGerarImagem, onRegistrarPagamento, setNewPayment, loading, financial
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
                        {trans.status === 'PENDENTE' && (
                            <>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Kg da LATAM:</label>
                            <NumberField
                                value={latamKg}
                                onChange={setLatamKg}
                                disabled={!isEditable}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Taxa por kg (R$):</label>
                            <NumberField
                                value={shippingRate}
                                onChange={setShippingRate}
                                disabled={!isEditable}
                            />
                        </div>
                            </>
                        )}

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Frete (R$):</label>
                            <NumberField
                                value={shipping}
                                onChange={setShipping}
                                disabled={!isEditable}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Imposto: (R$)</label>
                            <div className={styles.inputWithShortcut}>
                                <NumberField
                                    value={tax}
                                    onChange={setTax}
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
                        <button className={styles.btnSave} onClick={() => onUpdateStatus('ENVIADO')} disabled={loading}>
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
                        disabled={loading}
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
                        <button className={styles.btnConfirm} onClick={onRegistrarPagamento} disabled={loading}>
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
                    {financial.paid > 0 && (
                        <div className={styles.paymentStatus}>
                            <div className={styles.sRow} style={{ color: '#166534' }}>
                                <span>VALOR RECEBIDO</span>
                                <span className={styles.mono}>R$ {financial.paid.toFixed(2)}</span>
                            </div>
                            {financial.remaining > 0 && (
                                <div className={styles.debtRow}>
                                    <span>SALDO DEVEDOR</span>
                                    <span className={styles.mono}>R$ {financial.remaining.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
