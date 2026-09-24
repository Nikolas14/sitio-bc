'use client';

import { ReactNode, useEffect, useState } from 'react';
import styles from './EnvironmentGate.module.css';

export type EnvironmentRole = 'escritorio' | 'galpao';

interface EnvironmentGateProps {
  role: EnvironmentRole;
  children: ReactNode;
}

const labels = {
  escritorio: { title: 'Acesso do escritório', description: 'Administração, cadastro e fechamento semanal.' },
  galpao: { title: 'Acesso do galpão', description: 'Frequência e distribuição do abate.' },
};

export default function EnvironmentGate({ role, children }: EnvironmentGateProps) {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.resolve().then(() => {
      setAuthorized(sessionStorage.getItem(`sitio-bc:${role}`) === 'authorized');
      setChecking(false);
    });
  }, [role]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/environment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, password }),
    });
    if (!response.ok) {
      setError(response.status === 500 ? 'Senha deste ambiente ainda não configurada.' : 'Senha incorreta.');
      return;
    }
    sessionStorage.setItem(`sitio-bc:${role}`, 'authorized');
    setAuthorized(true);
  };

  if (checking) return null;
  if (authorized) return <>{children}</>;

  return (
    <main className={styles.screen}>
      <form className={styles.card} onSubmit={submit}>
        <span className={styles.eyebrow}>SITIO BC</span>
        <h1>{labels[role].title}</h1>
        <p>{labels[role].description}</p>
        <label htmlFor="environment-password">SENHA DO AMBIENTE</label>
        <input id="environment-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus />
        {error && <span className={styles.error}>{error}</span>}
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
