'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { supabase } from '@/api/supabase';
import styles from './page.module.css';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';

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

// Open-license fallbacks for products whose database image is unavailable locally.
const fallbackImages: Record<number, string> = {
  202: 'https://commons.wikimedia.org/wiki/Special:FilePath/Plucked_chicken_wing.jpg',
  4: 'https://commons.wikimedia.org/wiki/Special:FilePath/Raw_leg_chicken_quarters.jpg',
  11: 'https://commons.wikimedia.org/wiki/Special:FilePath/Raw_chicken_thighs.jpg',
  157: 'https://commons.wikimedia.org/wiki/Special:FilePath/Uncooked_chicken_legs.jpg',
  12: 'https://commons.wikimedia.org/wiki/Special:FilePath/Raw_chicken_thighs.jpg',
  16: 'https://images.unsplash.com/photo-1672787153655-0c19308dcc60?auto=format&fit=crop&w=1200&q=85',
  18: 'https://commons.wikimedia.org/wiki/Special:FilePath/Chicken_Liver_and_Gizzard_-_Howrah_2015-04-19_8195.JPG',
  101: 'https://commons.wikimedia.org/wiki/Special:FilePath/Minced-meat-74241_640.jpg',
  311: 'https://commons.wikimedia.org/wiki/Special:FilePath/Uncooked_chicken_feet_at_a_Hong_Kong_market.jpg',
};

export default function CatalogoEstoque() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
        setLoadError(error.message);
      } else if (data) {
        setLoadError(null);
        setProducts(data as unknown as IProduct[]);
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
    <PageLayout>
      {/* SIDEBAR - Filtros e Ações */}
      <Sidebar>
        <HeaderInput
          titulo="Catálogo"
          valor={searchTerm}
          setValor={setSearchTerm}
          labelDescricao="Buscar na lista ativa:"
          placeholder="Nome ou tipo do produto..."
        />

        <div className={styles.sidebarActions}>
            <button onClick={handlePrint} className={styles.btnPrint}>
                <Download size={17} />
                Salvar lista em PDF
            </button>
            <p className={styles.tip}>Na janela de impressão, selecione “Salvar como PDF”. A lista mostra apenas produtos disponíveis.</p>
        </div>

        <nav className={styles.categoryNav}>
            <label className={styles.label}>NAVEGAÇÃO RÁPIDA</label>
            {Object.keys(groupedProducts).sort().map(cat => (
                <a key={cat} href={`#cat-${cat}`} className={styles.navLink}>
                    {cat} <span>{groupedProducts[cat].length}</span>
                </a>
            ))}
        </nav>
      </Sidebar>

      {/* CONTEÚDO PRINCIPAL / ÁREA DE IMPRESSÃO */}
      <Main className={styles.mainContent}>
        <header className={styles.catalogHeader}>
            <div>
              <span className={styles.eyebrow}>BEIT CHABAD BELÉM</span>
              <h1>Lista de preços</h1>
              <p>Escolha seus produtos com praticidade.</p>
            </div>
            <div className={styles.headerMeta}>
              <span>Atualizada em</span>
              <strong>{new Date().toLocaleDateString('pt-BR')}</strong>
            </div>
        </header>

        <div className={styles.printHeader}>
            <span className={styles.eyebrow}>BEIT CHABAD BELÉM</span>
            <h1>Lista de preços</h1>
            <p>Atualizada em {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {loading ? (
          <div className={styles.loader}>Sincronizando dados com o servidor...</div>
        ) : loadError ? (
          <div className={styles.loader}>Erro ao carregar catálogo: {loadError}</div>
        ) : (
          Object.keys(groupedProducts).sort().map(category => (
            <section key={category} id={`cat-${category}`} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{category}</h2>

              <div className={styles.itemGrid}>
                {groupedProducts[category].map(product => (
                  <article key={product.id} className={styles.productCard}>
                    <div className={styles.imageFrame}>
                      {(fallbackImages[product.id] || product.details?.image_filename) ? (
                        <Image
                          src={fallbackImages[product.id] || `/images/produtos/${product.details?.image_filename}.jpg`}
                          alt={product.name}
                          fill
                          sizes="(max-width: 700px) 100vw, (max-width: 1200px) 40vw, 260px"
                          style={{ objectFit: 'cover' }}
                          unoptimized={Boolean(fallbackImages[product.id])}
                        />
                      ) : (
                        <div className={styles.noImage}>FOTO EM BREVE</div>
                      )}
                    </div>

                    <div className={styles.productInfo}>
                      <span className={styles.productCode}>PRODUTO #{product.id}</span>
                      <h3 className={styles.itemName}>{product.name}</h3>

                      <p className={styles.description}>
                        {product.details?.description || 'Produto selecionado com cuidado para você.'}
                      </p>

                      {product.details?.package_weight_approx && (
                        <p className={styles.packageInfo}>Embalagem aproximada: <strong>{product.details.package_weight_approx} kg</strong></p>
                      )}

                      <div className={styles.priceContainer}>
                        <span className={styles.priceLabel}>Preço</span>
                        <span className={styles.priceValue}>{formatCurrency(product.price)}</span>
                      </div>
                    </div>
                  </article>
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
      </Main>
    </PageLayout>
  );
}
