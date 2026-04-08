import { IProduct } from '@/types';
import styles from './GrupoEstoque.module.css'

interface GrupoEstoqueProps {
    category: string;
    list: IProduct[];
}

const GrupoEstoque = ({ category, list }: GrupoEstoqueProps) => {
    return (
        <div key={category} className={styles.productGroup}>
            {/* O título do grupo será o valor do IProduct.type */}
            <h3 className={styles.groupTitle}>{category}</h3>

            <table className={styles.reportTable}>
                <thead>
                    <tr>
                        <th className={styles.colCod}>Cod</th>
                        <th>Item</th>
                        <th className={styles.colQuant}>Saldo líquido</th>
                    </tr>
                </thead>
                <tbody>
                    {list.map(p => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td className={styles.quantValue}>
                                {new Intl.NumberFormat('pt-BR', {
                                    minimumFractionDigits: 3,
                                    maximumFractionDigits: 3
                                }).format(p.current_stock ?? 0)} {/* <--- Mude de current_stock para quant */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default GrupoEstoque
