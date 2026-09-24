'use client';

import Link from 'next/link';
import EnvironmentGate from '@/components/EnvironmentGate/EnvironmentGate';
import styles from './page.module.css';

export default function FechamentoPage() {
  return <EnvironmentGate role="escritorio"><main className={styles.page}>
    <span>AMBIENTE DO ESCRITÓRIO</span>
    <h1>Fechamento semanal</h1>
    <p>A apuração de frequência, extras e pagamentos será construída nesta tela.</p>
    <Link href="/funcionario/escritorio">Voltar ao escritório</Link>
  </main></EnvironmentGate>;
}
