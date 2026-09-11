'use client';

import { ReactNode } from 'react';
import styles from './PageLayout.module.css';

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