import styles from './page.module.css';

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`${styles.statusBadge} ${styles['status' + status]}`}>
    {status}
  </span>
);