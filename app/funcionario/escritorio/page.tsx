'use client';

import Link from 'next/link';
import EnvironmentGate from '@/components/EnvironmentGate/EnvironmentGate';
import styles from './page.module.css';

export default function EscritorioPage() {
  return (
    <EnvironmentGate role="escritorio">
      <main className={styles.page}>
        <header><span>AMBIENTE DO ESCRITÓRIO</span><h1>Administração</h1><p>Cadastros, extras e fechamento semanal.</p></header>
        <section className={styles.grid}>
          <Link className={styles.card} href="/funcionario/cadastro"><strong>Funcionários</strong><span>Cadastro, Pix, grupos e dados pessoais.</span></Link>
          <Link className={styles.card} href="/funcionario/escritorio/fechamento"><strong>Fechamento semanal</strong><span>Totais individuais e lista para pagamento.</span></Link>
          <Link className={styles.card} href="/"><strong>Voltar ao sistema</strong><span>Acessar os outros módulos do Sitio BC.</span></Link>
        </section>
      </main>
    </EnvironmentGate>
  );
}
