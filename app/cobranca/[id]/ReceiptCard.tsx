// /app/cobranca/[id]/ReceiptCard.tsx

import { forwardRef } from 'react';
// import styles from './page.module.css'; // Remova esta linha

interface ReceiptCardProps {
  trans: any;
  items: any[];
  shipping: number;
  tax: number;
  financial: any;
}

export const ReceiptCard = forwardRef<HTMLDivElement, ReceiptCardProps>(
  ({ trans, items, shipping, tax, financial }, ref) => {
    if (!trans) return null;

    const ITEMS_PER_PAGE = 15;
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
    const paginate = (array: any[], size: number) => {
      return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
        array.slice(i * size, i * size + size)
      );
    };

    const pages = paginate(items, ITEMS_PER_PAGE);

    return (
      <div ref={ref} className="captureContainer"> {/* Nome de classe simples */}
        {pages.map((pageItems, index) => {
          const isLastPage = index === pages.length - 1;

          return (
            <div key={index} className="receiptPaper"> {/* Nome de classe simples */}
              {isLastPage && trans.status === 'CONCLUIDO' && (
                <div className="paidStamp">PAGO</div> /* Nome de classe simples */
              )}

              <div className="receiptHeader"> {/* Nome de classe simples */}
                <div>
                  <span className="brandName">Beit Stock</span> {/* Nome de classe simples */}
                  <p className="mono" style={{ fontSize: '10px', margin: 0 }}>
                    PÁGINA {index + 1} / {totalPages}
                  </p>
                </div>
                <span className="mono">SÉRIE #{trans.serial_number ?? '000'}</span> {/* Nome de classe simples */}
              </div>

              {index === 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ textTransform: 'uppercase', margin: 0 }}>{trans.customer_vendor}</h2>
                  <p className="mono" style={{ color: '#64748b', fontSize: '14px' }}>
                    {trans.created_at ? new Date(trans.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                  </p>
                </div>
              )}

              <div className="tableArea"> {/* Nome de classe simples */}
                <table className="itemTable"> {/* Nome de classe simples */}
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th className="textCenter">Qtd</th> {/* Nome de classe simples */}
                      <th className="textRight">Total</th> {/* Nome de classe simples */}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, idx) => {
                      const price = Number(item.ESTOQUE_product?.price ?? 0);
                      const quant = Number(item.quant ?? 0);
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, textTransform: 'uppercase' }}>{item.ESTOQUE_product?.name ?? 'Produto'}</td>
                          <td className="textCenter mono">{quant.toFixed(2)}</td> {/* Nomes de classe simples */}
                          <td className="textRight mono">
                            R$ {(quant * price).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {isLastPage && (
                <div className="summarySection"> {/* Nome de classe simples */}
                  <div className="summaryLine">
                    <span>Mercadoria</span> 
                    <span className="mono">R$ {(financial?.sub ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="summaryLine">
                    <span>Frete</span> 
                    <span className="mono">
                      + R$ {(shipping ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="summaryLine">
                    <span>Taxas</span> 
                    <span className="mono">
                      + R$ {(tax ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="totalRow">
                    <div>
                      <span className="grandTotalLabel">TOTAL DO PEDIDO</span>
                      <span className="grandTotalValue mono">
                        R$ {(financial?.final ?? 0).toFixed(2)}
                      </span>
                    </div>
                    {(financial?.paid ?? 0) > 0 && (
                      <div className="textRight">
                        <span className="grandTotalLabel" style={{ color: '#10b981' }}>RECEBIDO</span>
                        <span className="mono" style={{ fontSize: '28px', color: '#10b981' }}>
                          R$ {(financial?.paid ?? 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pageFooter">Beit Stock • Auditoria e Controle de Estoque</div> {/* Nome de classe simples */}
            </div>
          );
        })}
      </div>
    );
  }
);

ReceiptCard.displayName = 'ReceiptCard';