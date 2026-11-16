'use client';

import { useState, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { supabase } from '@/api/supabase';
import styles from './page.module.css';

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

const categoryLabels: Record<string, string> = {
  CARNE: 'CORTES BOVINOS',
  ESPECIAL: 'CORTES BOVINOS ESPECIAIS',
  FRANGO: 'CORTES DE FRANGO',
  EMBUTIDOS: 'EMBUTIDOS E OUTROS',
};

const categoryOrder = ['CARNE', 'ESPECIAL', 'FRANGO', 'EMBUTIDOS'];
const localImageVersion = '2';
const getLocalImagePath = (filename: string) => {
  const normalizedFilename = /\.[a-z0-9]+$/i.test(filename) ? filename : `${filename}.jpg`;
  return `/images/produtos/${normalizedFilename}?v=${localImageVersion}`;
};

const categoryRank = (category: string) => {
  const index = categoryOrder.indexOf(category);
  return index === -1 ? 3 : index;
};

const getProductCategory = (product: IProduct) => {
  const name = product.name.toUpperCase();
  if (name.match(/\b(CARNEIRO|CORDEIRO|OVINO|OVINOS)\b/)) return 'EMBUTIDOS';
  if (product.type === 'CARNE' || product.type === 'ESPECIAL' || product.type === 'FRANGO') return product.type;
  return 'EMBUTIDOS';
};

// Colunas da grade do PDF: deve bater com o repeat(...) do @media print no CSS.
const PRINT_COLUMNS = 4;

const groupByCategory = (list: IProduct[]) =>
  list.reduce((acc: { [key: string]: IProduct[] }, product) => {
    const category = getProductCategory(product);
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

const formatStamp = (d: Date) =>
  `${d.toLocaleDateString('pt-BR')} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

export default function CatalogoEstoque() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [printedAt, setPrintedAt] = useState<Date | null>(null);
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

  // Data de impressão: só depois de montar, para servidor e cliente não divergirem.
  useEffect(() => setPrintedAt(new Date()), []);

  // Disponíveis: base da tela (com busca) e do PDF (sem busca).
  const availableProducts = useMemo(
    () => products.filter(p => p.details?.is_available !== false),
    [products],
  );

  // A busca vale só para a tela; o PDF sempre sai com a lista completa.
  const groupedProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return groupByCategory(availableProducts.filter(p =>
      p.name.toLowerCase().includes(term) || p.type?.toLowerCase().includes(term)
    ));
  }, [availableProducts, searchTerm]);

  const printGroups = useMemo(() => groupByCategory(availableProducts), [availableProducts]);

  const orderedProducts = useMemo(
    () => Object.keys(groupedProducts)
      .sort((a, b) => categoryRank(a) - categoryRank(b))
      .flatMap((category) => groupedProducts[category]),
    [groupedProducts],
  );

  const printPages = useMemo(() => {
    const pages: { category: string; products: IProduct[] }[][] = [];
    let page: { category: string; products: IProduct[] }[] = [];
    let usedRows = 0;

    Object.keys(printGroups).sort((a, b) => categoryRank(a) - categoryRank(b)).forEach((category) => {
      const categoryProducts = printGroups[category];
      let offset = 0;

      while (offset < categoryProducts.length) {
        let availableRows = 3 - usedRows;
        if (availableRows === 0) {
          pages.push(page);
          page = [];
          usedRows = 0;
          availableRows = 3;
        }

        const amount = Math.min(availableRows * PRINT_COLUMNS, categoryProducts.length - offset);
        page.push({ category, products: categoryProducts.slice(offset, offset + amount) });
        offset += amount;
        usedRows += Math.ceil(amount / PRINT_COLUMNS);
      }
    });
    if (page.length > 0) pages.push(page);
    return pages;
  }, [printGroups]);

  // flushSync garante que o cabeçalho já mostra a hora certa antes do diálogo de impressão.
  const handlePrint = () => {
    flushSync(() => setPrintedAt(new Date()));
    window.print();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <main className={styles.catalogPage}>
        <header className={styles.catalogHeader}>
          <div>
            <span className={styles.eyebrow}>BEIT CHABAD BELÉM</span>
            <h1>Lista de preços</h1>
            <p>Escolha seus produtos com praticidade.</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.headerMeta}>Atualizada em <strong>{printedAt ? printedAt.toLocaleDateString('pt-BR') : '—'}</strong></span>
            <button onClick={handlePrint} className={styles.btnPrint}><Download size={17} />Salvar lista em PDF</button>
          </div>
        </header>

        <section className={styles.filterBar} aria-label="Filtros do catálogo">
          <label className={styles.searchField}>
            <span>BUSCAR PRODUTO</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nome ou tipo do produto..." />
          </label>
        </section>

        <div className={`${styles.catalogContent} ${styles.screenCatalog}`}>
        <div className={styles.printHeader}>
            <span className={styles.eyebrow}>BEIT CHABAD BELÉM</span>
            <h1>Lista de preços</h1>
            <div className={styles.printDate}>
              <span>LISTA GERADA EM</span>
              <strong>{printedAt ? formatStamp(printedAt) : '—'}</strong>
            </div>
        </div>

        {loading ? (
          <div className={styles.loader}>Sincronizando dados com o servidor...</div>
        ) : loadError ? (
          <div className={styles.loader} role="alert">Não foi possível carregar a lista de preços. Atualize a página para tentar de novo.</div>
        ) : (
          Object.keys(groupedProducts).sort((a, b) => categoryRank(a) - categoryRank(b)).map((category, categoryIndex) => (
            <section key={category} className={`${styles.categorySection} ${category === 'FRANGO' ? styles.afterSpecial : ''}`}>
              <h2 className={styles.categoryTitle}>{categoryLabels[category] || category}</h2>
              <div className={styles.itemGrid}>
                {groupedProducts[category].map((product, productIndex) => (
                  <article key={product.id} className={styles.productCard}>
                    <div className={styles.imageFrame}>
                      {product.details?.image_filename ? (
                          <Image
                           src={getLocalImagePath(product.details.image_filename)}
                           alt=""
                           fill
                           sizes="(max-width: 700px) 50vw, (max-width: 1150px) 33vw, 20vw"
                           style={{ objectFit: 'cover' }}
                           loading={categoryIndex === 0 && productIndex < 5 ? 'eager' : 'lazy'}
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
                        <span className={styles.priceLabel}>Preço por kg</span>
                        <span className={styles.priceValue}>{formatCurrency(product.price)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}

        {!loading && !loadError && orderedProducts.length === 0 && (
          <div className={styles.emptyState}>
            <p>Nenhum produto disponível encontrado para esta busca.</p>
          </div>
        )}
        </div>

        <div className={styles.printCatalog}>
          {printPages.map((page, pageIndex) => (
            <section key={pageIndex} className={styles.printPage}>
              <header className={styles.printPageHeader}>
                <span className={styles.eyebrow}>BEIT CHABAD BELÉM</span>
                <h1>Lista de preços</h1>
                <div className={styles.printDate}>
                  <span>LISTA GERADA EM</span>
                  <strong>{printedAt ? formatStamp(printedAt) : '—'}</strong>
                </div>
              </header>
              {page.map((segment) => (
                <section key={`${pageIndex}-${segment.category}`} className={styles.printSegment}>
                  <h2 className={styles.categoryTitle}>{categoryLabels[segment.category] || segment.category}</h2>
                  <div className={styles.itemGrid}>
                    {segment.products.map((product) => (
                      <article key={product.id} className={styles.productCard}>
                        <div className={styles.imageFrame}>
                          {product.details?.image_filename ? (
                            <Image
                              src={getLocalImagePath(product.details.image_filename)}
                              alt=""
                              fill
                              sizes="170px"
                              style={{ objectFit: 'cover' }}
                              loading="eager"
                            />
                          ) : <div className={styles.noImage}>FOTO EM BREVE</div>}
                        </div>
                        <div className={styles.productInfo}>
                          <span className={styles.productCode}>PRODUTO #{product.id}</span>
                          <h3 className={styles.itemName}>{product.name}</h3>
                          <p className={styles.description}>{product.details?.description || 'Produto selecionado com cuidado para você.'}</p>
                          {product.details?.package_weight_approx && <p className={styles.packageInfo}>Embalagem aproximada: <strong>{product.details.package_weight_approx} kg</strong></p>}
                          <div className={styles.priceContainer}><span className={styles.priceLabel}>Preço por kg</span><span className={styles.priceValue}>{formatCurrency(product.price)}</span></div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </section>
          ))}
        </div>
    </main>
  );
}
