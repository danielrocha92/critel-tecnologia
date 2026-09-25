import React from 'react';
import styles from './Skeleton.module.css';

export function SkeletonRow() {
  return (
    <>
      <tr>
        <td><div className={`${styles.pulse} ${styles.ticketHeight} ${styles.ticketId}`}></div></td>
        <td><div className={`${styles.pulse} ${styles.ticketHeight} ${styles.ticketTitle}`}></div></td>
        <td><div className={`${styles.pulse} ${styles.ticketHeight} ${styles.ticketDept}`}></div></td>
        <td><div className={`${styles.pulse} ${styles.ticketHeight} ${styles.ticketPriority}`}></div></td>
        <td><div className={`${styles.pulse} ${styles.ticketHeight} ${styles.ticketStatus}`}></div></td>
        <td><div className={`${styles.pulse} ${styles.ticketHeight} ${styles.ticketClient}`}></div></td>
        <td>
          <div className={`${styles.pulse} ${styles.ticketHeight} ${styles.ticketDateMain}`}></div>
          <div className={`${styles.pulse} ${styles.ticketDateSub}`}></div>
        </td>
        <td>
          <div className={`${styles.pulse} ${styles.ticketHeight} ${styles.ticketDateMain}`}></div>
          <div className={`${styles.pulse} ${styles.ticketDateSub}`}></div>
        </td>
        <td><div className={`${styles.pulse} ${styles.ticketHeight} ${styles.ticketAssignee}`}></div></td>
        <td><div className={`${styles.pulse} ${styles.ticketAction}`}></div></td>
      </tr>
    </>
  );
}
