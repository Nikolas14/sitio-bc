'use client';

import styles from './StatusFilter.module.css';

interface StatusFilterProps {
    label: string;
    options: string[];
    selectedOptions: string[];
    onToggle: (option: string) => void;
    onClear: () => void;
}

const StatusFilter = ({
    label,
    options,
    selectedOptions,
    onToggle,
    onClear
}: StatusFilterProps) => {
    return (
        <div className={styles.filterGroup}>
            <div className={styles.labelRow}>
                <label className={styles.label}>{label}</label>
                {selectedOptions.length > 0 && (
                    <button onClick={onClear} className={styles.clearBtn}>Limpar</button>
                )}
            </div>

            <div className={styles.statusList}>
                {options.map((option) => (
                    <button
                        key={option}
                        onClick={() => onToggle(option)}
                        className={`${styles.filterBtn} ${selectedOptions.includes(option) ? styles.filterBtnActive : ''
                            }`}
                    >
                        <span className={styles.indicator}></span>
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StatusFilter;