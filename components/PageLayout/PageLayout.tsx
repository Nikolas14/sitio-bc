'use client';

import { ReactNode } from 'react';
import styles from './PageLayout.module.css';

/*
 * PADRÃO DE LAYOUT DO PROJETO
 * ---------------------------
 * Toda página de operação usa:
 *
 *   <PageLayout>
 *     <Sidebar>  HeaderPadrao | HeaderInput  + filtros/ações  </Sidebar>
 *     <Main>     [PageHeader opcional] + conteúdo             </Main>
 *   </PageLayout>
 *
 * - Sidebar: 30% da largura, sempre começa com HeaderPadrao (só título) ou
 *   HeaderInput (título + busca). Fica visível também em loading/erro.
 * - Main: área com rolagem. Use <PageHeader> quando a área for uma lista/relatório
 *   sem cabeçalho próprio.
 * - Carregando / erro / vazio: use <PageState> DENTRO do Main. Não faça
 *   "return <div>" antes do PageLayout, senão a barra lateral some.
 * - Exceções assumidas: home (menu) e lista_preco (catálogo para impressão).
 */

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return <div className={`${styles.screen} ${className ?? ''}`}>{children}</div>;
}

export function Sidebar({ children, className }: PageLayoutProps) {
  return <aside className={`${styles.sidebar} ${className ?? ''}`}>{children}</aside>;
}

export function Main({ children, className }: PageLayoutProps) {
  return <main className={`${styles.main} ${className ?? ''}`}>{children}</main>;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Conteúdo à direita (contagem, botões...). */
  aside?: ReactNode;
}

/** Título padrão da área principal. */
export function PageHeader({ title, subtitle, aside }: PageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {aside && <div className={styles.pageHeaderAside}>{aside}</div>}
    </header>
  );
}

interface PageStateProps {
  kind: 'loading' | 'error' | 'empty';
  message: string;
}

/** Estado de carregando, erro ou vazio, centralizado dentro do Main. */
export function PageState({ kind, message }: PageStateProps) {
  return (
    <div
      className={`${styles.state} ${kind === 'error' ? styles.stateError : ''}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {message}
    </div>
  );
}
