import { createPortal } from 'react-dom';
import styles from './BottomSheet.module.css';

function BottomSheet({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {title && (
          <header className={styles.header}>
            <span>{title}</span>
            <button type="button" onClick={onClose}>
              ×
            </button>
          </header>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export default BottomSheet;
