'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import styles from './page.module.css';
import HeaderInput from '@/components/HeaderInput/HeaderInput';

interface IProduct {
  id: number;
  name: string;
  type: string;
  price: number;
  description?: string;
  image_url?: string;
}

export default function CatalogoEstoque() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase
        .from('ESTOQUE_product')
        .select('*')
        .order('name', { ascending: true });
      
      if (data) setProducts(data);
      setLoading(false);
    }
    loadProducts();
  }, []);

  // Agrupamento por Categoria (Type)
  const groupedProducts = useMemo(() => {
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce((acc: { [key: string]: IProduct[] }, product) => {
      const category = product.type || 'OUTROS';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [products, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className={styles.screen}>
      {/* SIDEBAR - Escondida na impressão via CSS */}
      <aside className={styles.sidebar}>
        <HeaderInput
          titulo="Catálogo"
          valor={searchTerm}
          setValor={setSearchTerm}
          labelDescricao="Filtro de busca:"
          placeholder="Nome ou tipo..."
        />
        
        <div className={styles.sidebarActions}>
            <button onClick={handlePrint} className={styles.btnPrint}>
                🖨️ Imprimir Lista
            </button>
            <p className={styles.tip}>Dica: O cabeçalho e a barra lateral não aparecem no papel.</p>
        </div>

        <nav className={styles.categoryNav}>
            <label className={styles.label}>ATALHOS</label>
            {Object.keys(groupedProducts).sort().map(cat => (
                <a key={cat} href={`#cat-${cat}`} className={styles.navLink}>
                    {cat} <span>{groupedProducts[cat].length}</span>
                </a>
            ))}
        </nav>
      </aside>

      {/* ÁREA DE IMPRESSÃO */}
      <main className={styles.mainContent}>
        <div className={styles.printHeader}>
            <h1>RELATÓRIO DE PRODUTOS E PREÇOS</h1>
            <p>Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        {loading ? (
          <div className={styles.loader}>Buscando dados...</div>
        ) : (
          Object.keys(groupedProducts).sort().map(category => (
            <section key={category} id={`cat-${category}`} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{category}</h2>

              <div className={styles.itemList}>
                {groupedProducts[category].map(product => (
                  <div key={product.id} className={styles.itemRow}>
                    <div className={styles.imageThumb}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} />
                      ) : (
                        <div className={styles.noImage}>S/ IMG</div>
                      )}
                    </div>

                    <div className={styles.info}>
                      <div className={styles.nameRow}>
                        <span className={styles.id}>#{product.id}</span>
                        <h3 className={styles.itemName}>{product.name}</h3>
                      </div>
                      <p className={styles.description}>{product.description}</p>
                    </div>

                    <div className={styles.priceContainer}>
                      <span className={styles.price}>{formatCurrency(product.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}