import styles from './Card.module.css';

function Card({ children, className = '', onClick, glow = true, flat = false }) {
  const classes = [styles.card, glow ? styles.glow : '', flat ? styles.flat : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className={styles.inner}>{children}</div>
      <span className={styles.light} />
    </div>
  );
}

export default Card;
