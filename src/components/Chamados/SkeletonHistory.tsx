import React from 'react';
import styles from './Skeleton.module.css';

export function SkeletonHistory() {
  return (
    <div className={styles.historyContainer}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.historyRow}>
          <div className={`${styles.pulse} ${styles.historyAvatar}`}></div>
          <div className={styles.historyContent}>
            <div className={`${styles.pulse} ${styles.historyName}`}></div>
            <div className={`${styles.pulse} ${styles.historyText}`}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
