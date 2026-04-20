'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import AdminPasswordModal from '@/components/AdminPasswordModal/AdminPasswordModal';
import { useProductManager } from '@/hooks/useProductManager';

export default function GerenciadorProdutos() {
    const router = useRouter();
    const {
        isAdmin, adminPassword, setAdminPassword, handleAdminConfirm,
        loading, searchTerm, setSearchTerm, filteredProducts,
        selectedId, setSelectedId, formData, setFormData,
        handleSelect, handleSave, handleDelete
    } = useProductManager();

    if (!isAdmin) {
        return (
            <AdminPasswordModal
                password={adminPassword}
                setPassword={setAdminPassword}
                onConfirm={() => handleAdminConfirm('123')}
                onCancel={() => router.back()}
            />
        );
    }

    return (
        <div className={styles.screen}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTop}>
                    <HeaderInput
                        titulo='Produtos'
                        setValor={setSearchTerm}
                        valor={searchTerm}
                        labelDescricao='Pesquise um produto:'
                        placeholder='Digite um Id ou nome.'
                    />
                </div>

                <nav className={styles.productList}>
                    {filteredProducts.map(p => (
                        <div
                            key={p.id}
                            className={`${styles.productItem} ${selectedId === p.id ? styles.active : ''}`}
                            onClick={() => handleSelect(p)}
                        >
                            <div className={styles.itemHeader}>
                                <span className={styles.itemType}>{p.type || 'S/ CAT'}</span>
                                <span className={styles.itemId}>#{p.id}</span>
                            </div>
                            <span className={styles.itemName}>{p.name}</span>
                        </div>
                    ))}
                </nav>

                <div className={styles.sidebarBottom}>
                    <button className={styles.btnAdd} onClick={() => handleSelect('new')}>
                        + Novo Produto
                    </button>
                </div>
            </aside>

            <main className={styles.mainContent}>
                {selectedId ? (
                    <form onSubmit={handleSave} className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <h2>{selectedId === 'new' ? 'Novo Cadastro' : 'Editar Produto'}</h2>
                            <p>{selectedId === 'new' ? 'Preencha os campos para criar o item.' : `Editando ID #${selectedId}`}</p>
                        </div>

                        <div className={styles.formGrid}>
                            <div className={`${styles.idField} ${selectedId !== 'new' ? styles.locked : ''}`}>
                                <label className={styles.label}>ID DO PRODUTO (MANUAL)</label>
                                <input
                                    type="number"
                                    value={formData.id}
                                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                    disabled={selectedId !== 'new'}
                                    className={styles.input}
                                    placeholder="Vazio para automático"
                                />
                                {selectedId !== 'new' && <small>O ID não pode ser editado.</small>}
                            </div>

                            <div className={styles.full}>
                                <label className={styles.label}>NOME DO PRODUTO</label>
                                <input required className={styles.input} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div>
                                <label className={styles.label}>CATEGORIA</label>
                                <select required className={styles.select} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    <option value="FRANGO">FRANGO</option>
                                    <option value="CARNE">CARNE</option>
                                    <option value="EMBUTIDOS">EMBUTIDOS</option>
                                    <option value="SORVETE">SORVETE</option>
                                    <option value="PEIXE">PEIXE</option>
                                    <option value="OUTROS">ESPECIAL</option>
                                </select>
                            </div>

                            <div>
                                <label className={styles.label}>PREÇO (R$)</label>
                                <input type="number" step="0.01" className={styles.input} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                            </div>

                            <div className={styles.full}>
                                <label className={styles.label}>PESO MÉDIO / REF (KG)</label>
                                <input type="number" step="0.001" className={styles.input} value={formData.weightAlt} onChange={(e) => setFormData({ ...formData, weightAlt: e.target.value })} />
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            {selectedId !== 'new' && (
                                <button type="button" className={styles.btnDelete} onClick={handleDelete} disabled={loading}>
                                    Excluir Produto
                                </button>
                            )}

                            <div className={styles.rightActions}>
                                <button type="button" className={styles.btnCancel} onClick={() => setSelectedId(null)}>Cancelar</button>
                                <button type="submit" className={styles.btnSave} disabled={loading}>
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📦</div>
                        <p>Selecione um produto na lista lateral para gerenciar.</p>
                    </div>
                )}
            </main>
        </div>
    );
}