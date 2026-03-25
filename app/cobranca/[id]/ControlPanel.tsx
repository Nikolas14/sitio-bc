import styles from './page.module.css';
import { StatusBadge } from './StatusBadge';

interface ControlPanelProps {
    trans: any;
    shipping: number;
    setShipping: (val: number) => void;
    tax: number;
    setTax: (val: number) => void;
    isEditable: boolean;
    onUpdateStatus: (status: string) => void;
    onGerarImagem: () => void;
    onRegistrarPagamento: () => void;
    setNewPayment: (val: number) => void;
}

export const ControlPanel = ({
    trans, shipping, setShipping, tax, setTax, isEditable,
    onUpdateStatus, onGerarImagem, onRegistrarPagamento, setNewPayment
}: ControlPanelProps) => {
    return (
        <section className={styles.leftPanel}>
            <div className={styles.header}>
                <button onClick={() => window.history.back()} className={styles.backBtn}>← Voltar</button>
                <h1>Cobrança</h1>
                <StatusBadge status={trans.status} />
            </div>

            {/* Inputs sumirão se já foi cobrado/concluido para limpar o layout */}
            {trans.status !== 'COBRADO' && trans.status !== 'CONCLUIDO' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label className={styles.label}>Logística (Frete R$)</label>
                        <input type="number" className={styles.field} value={shipping} onChange={e => setShipping(Number(e.target.value))} disabled={!isEditable} />
                    </div>
                    <div>
                        <label className={styles.label}>Taxas e Impostos (R$)</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="number" className={styles.field} value={tax} onChange={e => setTax(Number(e.target.value))} disabled={!isEditable} />
                            {isEditable && <button className={styles.taxBtn} onClick={() => setTax(Number(trans.total_price) * 0.10)}>10%</button>}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                {/* 1. Ação para PENDENTE */}
                {isEditable && (
                    <button className={styles.btnAction} onClick={() => onUpdateStatus('ENVIADO')}>
                        Finalizar Custos e Salvar
                    </button>
                )}

                {/* 2. Botão de Download (Aparece em ENVIADO, COBRADO e CONCLUIDO) */}
                {trans.status !== 'PENDENTE' && (
                    <button
                        className={styles.downloadBtn}
                        onClick={onGerarImagem}
                        style={trans.status !== 'ENVIADO' ? { background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' } : {}}
                    >
                        {trans.status === 'CONCLUIDO' ? '🖼️ Baixar Recibo Final' : '🖼️ Baixar Comprovante Visual'}
                    </button>
                )}

                {/* 3. Seção de Registro de Pagamento (Apenas no COBRADO) */}
                {trans.status === 'COBRADO' && (
                    <div style={{ marginTop: '10px', padding: '15px', background: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                        <label className={styles.label} style={{ color: '#15803d', fontWeight: 800 }}>Registrar Pagamento Recebido</label>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <input type="number" className={styles.field} placeholder="Valor R$" onChange={e => setNewPayment(Number(e.target.value))} />
                            <button className={styles.taxBtn} style={{ background: '#16a34a', color: '#fff', border: 'none' }} onClick={onRegistrarPagamento}>Confirmar</button>
                        </div>
                    </div>
                )}

                {/* 4. Feedback de Sucesso (Apenas no CONCLUIDO) */}
                {trans.status === 'CONCLUIDO' && (
                    <div style={{ textAlign: 'center', fontWeight: 800, color: '#15803d', padding: '10px' }}>
                        PAGAMENTO TOTALIZADO ✅
                    </div>
                )}

            </div>
        </section>
    );
};