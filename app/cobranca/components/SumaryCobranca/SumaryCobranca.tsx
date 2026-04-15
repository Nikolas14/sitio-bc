'use client';

import { ITransaction } from '@/types';
import styles from './SumaryCobranca.module.css';

interface Props {
    trans: ITransaction;
}

const SumaryCobranca = ({ trans }: Props) => {
    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const precoBruto = trans.total_price || 0;
    const frete = trans.shipping_cost || 0;
    const taxa = trans.tax_amount || 0;
    const descontoReais = precoBruto * ((trans.discount_percent || 0) / 100);
    const valorFinal = (precoBruto - descontoReais) + frete + taxa;

    return (
        <header className={styles.fullContainer}>
            {/* Linha Superior: Cliente e Status */}
            <div className={styles.topRow}>
                <div className={styles.clientGroup}>
                    <span className={styles.mainLabel}>CLIENTE</span>
                    <h1 className={styles.clientName}>{trans.customer_vendor}</h1>
                </div>
                <div className={styles.statusGroup}>
                    <span className={`${styles.statusBadge} ${styles[trans.status.toLowerCase()]}`}>
                        {trans.status}
                    </span>
                </div>
            </div>

            {/* Linha Inferior: Info Bar Compacta */}
            <div className={styles.infoBar}>
                <div className={styles.section}>
                    <div className={styles.item}>
                        <span className={styles.label}>SÉRIE</span>
                        <span className={styles.value}>#{trans.serial_number}</span>
                    </div>
                    <div className={styles.item}>
                        <span className={styles.label}>EMISSÃO</span>
                        <span className={styles.value}>{new Date(trans.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className={styles.item}>
                        <span className={styles.label}>PESO</span>
                        <span className={styles.value}>{(trans.total_kg || 0).toFixed(2)} kg</span>
                    </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.section}>
                    <div className={styles.item}>
                        <span className={styles.label}>BRUTO</span>
                        <span className={styles.value}>{formatCurrency(precoBruto)}</span>
                    </div>
                    <div className={styles.item}>
                        <span className={styles.label}>FRETE/TAXA</span>
                        <span className={styles.value}>{formatCurrency(frete + taxa)}</span>
                    </div>
                    <div className={styles.item}>
                        <span className={styles.label}>DESC.</span>
                        <span className={styles.valueTextRed}>-{trans.discount_percent}%</span>
                    </div>
                </div>

                <div className={styles.totalSection}>
                    <span className={styles.totalLabel}>TOTAL À COBRAR</span>
                    <span className={styles.totalValue}>{formatCurrency(valorFinal)}</span>
                    {trans.paid_amount > 0 && (
                        <span className={styles.paidAmount}>
                            (Pago: {formatCurrency(trans.paid_amount)} - Saldo: {formatCurrency(Math.max(0, valorFinal - trans.paid_amount))})
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
};

export default SumaryCobranca;