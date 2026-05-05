import { useRouter } from 'next/navigation';
import styles from './HeaderPadrao.module.css'

interface props {titulo:string}

const HeaderPadrao = ({titulo}:props) => {
    const router = useRouter();
    return (
        <header className={styles.header}>
            <button className={styles.backBtn} onClick={() => router.back()}>
                <span className={styles.icon}>←</span> VOLTAR
            </button>
            <h1 className={styles.mainTitle}>{titulo}</h1>
        </header>
    )
}

export default HeaderPadrao

