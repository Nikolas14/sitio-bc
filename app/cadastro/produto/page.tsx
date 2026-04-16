'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/api/supabase';
import styles from './page.module.css';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import AdminPasswordModal from '@/components/AdminPasswordModal/AdminPasswordModal';
import HeaderInput from '@/components/HeaderInput/HeaderInput';

interface IProduct {
    id: number;
    name: string;
    type?: string;
    price?: number;
    weightAlt?: number;
}

export default function GerenciadorProdutos() {
    const router = useRouter();

    // --- ESTADOS DE ACESSO ---
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');

    // --- ESTADOS DE DADOS ---
    const [products, setProducts] = useState<IProduct[]>([]);
    const [selectedId, setSelectedId] = useState<number | 'new' | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        type: '',
        price: '',
        weightAlt: ''
    });

    // Carregar produtos
    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('ESTOQUE_product')
            .select('*')
            .order('name', { ascending: true });

        if (data) setProducts(data);
        if (error) console.error("Erro ao carregar:", error);
    };

    useEffect(() => {
        if (isAdmin) fetchProducts();
    }, [isAdmin]);

    // Lógica de Seleção
    const handleSelect = (prod: IProduct | 'new') => {
        if (prod === 'new') {
            setSelectedId('new');
            setFormData({ id: '', name: '', type: '', price: '', weightAlt: '' });
        } else {
            setSelectedId(prod.id);
            setFormData({
                id: prod.id.toString(),
                name: prod.name,
                type: prod.type || '',
                price: prod.price?.toString() || '',
                weightAlt: prod.weightAlt?.toString() || ''
            });
        }
    };

    // Salvar (Insert/Update)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: any = {
            name: formData.name,
            type: formData.type,
            price: parseFloat(formData.price) || 0,
            weightAlt: parseFloat(formData.weightAlt) || 0,
        };

        let error;
        if (selectedId === 'new') {
            if (formData.id) payload.id = parseInt(formData.id);
            const { error: insError } = await supabase.from('ESTOQUE_product').insert([payload]);
            error = insError;
        } else {
            const { error: updError } = await supabase.from('ESTOQUE_product').update(payload).eq('id', selectedId);
            error = updError;
        }

        if (error) {
            alert("Erro ao salvar: " + error.message);
        } else {
            await fetchProducts();
            setSelectedId(null);
        }
        setLoading(false);
    };

    // Excluir
    const handleDelete = async () => {
        if (selectedId === 'new' || !selectedId) return;

        if (confirm(`Excluir permanentemente o produto "${formData.name}"?`)) {
            setLoading(true);
            const { error } = await supabase.from('ESTOQUE_product').delete().eq('id', selectedId);

            if (error) {
                alert("Erro: O produto pode estar vinculado a movimentações existentes.");
            } else {
                await fetchProducts();
                setSelectedId(null);
            }
            setLoading(false);
        }
    };

    // Validação do Admin
    const handleAdminConfirm = () => {
        // Defina sua senha aqui
        if (adminPassword === '123') {
            setIsAdmin(true);
        } else {
            alert('Senha incorreta!');
            setAdminPassword('');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toString().includes(searchTerm)
    );

    // 1. BARREIRA DE ADMIN
    if (!isAdmin) {
        return (
            <AdminPasswordModal
                password={adminPassword}
                setPassword={setAdminPassword}
                onConfirm={handleAdminConfirm}
                onCancel={() => router.back()}
            />
        );
    }

    // 2. PÁGINA PRINCIPAL
    return (
        <div className={styles.screen}>
            <aside className={styles.sidebar}>
                <HeaderInput
                    titulo='Produtos'
                    setValor={setSearchTerm}
                    valor={searchTerm}
                    labelDescricao='Pesquise um produto:'
                    placeholder='Digite um Id ou nome.'
                />

                <nav className={styles.productList}>
                    {filteredProducts.map(p => (
                        <div
                            key={p.id}
                            className={`${styles.productItem} ${selectedId === p.id ? styles.active : ''}`}
                            onClick={() => handleSelect(p)}
                        >
                            <div className={styles.itemHeader}>
                                <span className={styles.itemType}>{p.type}</span>
                                <span className={styles.itemId}>#{p.id}</span>
                            </div>
                            <span className={styles.itemName}>{p.name}</span>
                        </div>
                    ))}
                </nav>

                <button className={styles.btnAdd} onClick={() => handleSelect('new')}>
                    + Novo Produto
                </button>
            </aside>

            <main className={styles.mainContent}>
                {selectedId ? (
                    <form onSubmit={handleSave} className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <h2>{selectedId === 'new' ? 'Novo Cadastro' : 'Editar Produto'}</h2>
                            <p>{selectedId === 'new' ? 'Preencha os campos para criar o item.' : `Editando ID #${selectedId}`}</p>
                        </div>

                        <div className={styles.formGrid}>
                            <div className={styles.idField}>
                                <label className={styles.label}>ID DO PRODUTO (MANUAL)</label>
                                <input
                                    type="number"
                                    value={formData.id}
                                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                    disabled={selectedId !== 'new'}
                                    className={selectedId !== 'new' ? styles.disabledInput : styles.input}
                                    placeholder="Vazio para automático"
                                />
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
                                    <option value="EXTRA">EXTRA</option>
                                    <option value="INTERNO">INTERNO</option>
                                    <option value="ISOPOR">ISOPOR</option>
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
                                <button type="button" className={styles.btnCancel} onClick={() => setSelectedId(null)}>
                                    Cancelar
                                </button>
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