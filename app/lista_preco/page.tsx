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
  details?: {
    description: string;
    package_weight_approx: number;
    image_filename: string;
    is_available: boolean;
  };
}

export default function CatalogoEstoque() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      // Realiza a busca com Join na tabela de detalhes
      const { data, error } = await supabase
        .from('ESTOQUE_product')
        .select(`
          *,
          details:ESTOQUE_product_details (
            description,
            package_weight_approx,
            image_filename,
            is_available
          )
        `)
        .order('name', { ascending: true });
      
      if (error) {
        console.error("Erro ao carregar catálogo:", error.message);
      } else if (data) {
        setProducts(data);
      }
      setLoading(false);
    }
    loadProducts();
  }, []);

  // Lógica de filtragem e agrupamento
  const groupedProducts = useMemo(() => {
    const filtered = products.filter(p => {
      // Filtro 1: Termo de busca (Nome ou Categoria)
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro 2: Disponibilidade (SÓ MOSTRA SE FOR DIFERENTE DE FALSE)
      const isAvailable = p.details?.is_available !== false;

      return matchesSearch && isAvailable;
    });

    // Agrupa o resultado por categoria (type)
    return filtered.reduce((acc: { [key: string]: IProduct[] }, product) => {
      const category = product.type || 'OUTROS';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [products, searchTerm]);

  const handlePrint = () => window.print();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className={styles.screen}>
      {/* SIDEBAR - Filtros e Ações */}
      <aside className={styles.sidebar}>
        <HeaderInput
          titulo="Catálogo"
          valor={searchTerm}
          setValor={setSearchTerm}
          labelDescricao="Buscar na lista ativa:"
          placeholder="Nome ou tipo do produto..."
        />
        
        <div className={styles.sidebarActions}>
            <button onClick={handlePrint} className={styles.btnPrint}>
                🖨️ Imprimir Tabela
            </button>
            <p className={styles.tip}>Nota: Itens marcados como indisponíveis no sistema não aparecem nesta lista.</p>
        </div>

        <nav className={styles.categoryNav}>
            <label className={styles.label}>NAVEGAÇÃO RÁPIDA</label>
            {Object.keys(groupedProducts).sort().map(cat => (
                <a key={cat} href={`#cat-${cat}`} className={styles.navLink}>
                    {cat} <span>{groupedProducts[cat].length}</span>
                </a>
            ))}
        </nav>
      </aside>

      {/* CONTEÚDO PRINCIPAL / ÁREA DE IMPRESSÃO */}
      <main className={styles.mainContent}>
        <div className={styles.printHeader}>
            <h1>TABELA DE PRODUTOS E PREÇOS</h1>
            <p>Atualizado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        {loading ? (
          <div className={styles.loader}>Sincronizando dados com o servidor...</div>
        ) : (
          Object.keys(groupedProducts).sort().map(category => (
            <section key={category} id={`cat-${category}`} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{category}</h2>

              <div className={styles.itemList}>
                {groupedProducts[category].map(product => (
                  <div key={product.id} className={styles.itemRow}>
                    <div className={styles.imageThumb}>
                      <h5 className={styles.itemName}>{product.details?.is_available ? 'Disponível' : 'Indisponível'}</h5>
                      {product.details?.image_filename ? (
                        <img 
                          src={`/images/produtos/${product.details.image_filename}.jpg`} 
                          //src={`/images/produtos/1.jpg`} 
                          alt={product.name} 
                        />
                      ) : (
                        <div className={styles.noImage}>S/ FOTO</div>
                      )}
                    </div>

                    <div className={styles.info}>
                      <div className={styles.nameRow}>
                        <span className={styles.id}>#{product.id}</span>
                        <h3 className={styles.itemName}>{product.name}</h3>
                      </div>
                      
                      <p className={styles.description}>
                        {product.details?.description || 'Descrição não cadastrada.'}
                      </p>

                      {product.details?.package_weight_approx && (
                        <span className={styles.weightBadge}>
                          Emb: aprox. {product.details.package_weight_approx}kg
                        </span>
                      )}
                    </div>

                    <div className={styles.priceContainer}>
                      <span className={styles.priceLabel}>Preço Unit.</span>
                      <span className={styles.priceValue}>{formatCurrency(product.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        {!loading && Object.keys(groupedProducts).length === 0 && (
          <div className={styles.emptyState}>
            <p>Nenhum produto disponível encontrado para esta busca.</p>
          </div>
        )}
      </main>
    </div>
  );
}