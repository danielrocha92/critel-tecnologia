import type { ReactNode } from 'react';
import styles from './SectionPageHeader.module.css';

export default function SectionPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      {action && <div className={styles.actions}>{action}</div>}
    </header>
  );
}
