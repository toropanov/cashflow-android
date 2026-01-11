import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  { id: 'home', label: 'Лента', path: '/app' },
  { id: 'invest', label: 'Инвестиции', path: '/app/invest' },
  { id: 'stats', label: 'Статистика', path: '/app/stats' },
  { id: 'reset', label: 'Сброс', path: '/choose' },
];

function Icon({ id, active }) {
  const stroke = active ? '#0b1024' : '#8ca2d8';
  switch (id) {
    case 'invest':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 16L9 11L13 15L20 8"
            stroke={stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="11" r="2" fill={stroke} opacity="0.4" />
          <circle cx="4" cy="16" r="2" fill={stroke} opacity="0.4" />
          <circle cx="20" cy="8" r="2" fill={stroke} opacity="0.4" />
        </svg>
      );
    case 'stats':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="12" width="3.5" height="8" rx="1.5" fill={stroke} opacity="0.4" />
          <rect x="10.5" y="8" width="3.5" height="12" rx="1.5" fill={stroke} />
          <rect x="17" y="4" width="3.5" height="16" rx="1.5" fill={stroke} opacity="0.7" />
        </svg>
      );
    case 'reset':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 5V11H12"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 19V13H12"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 13C17 9 14 6 11 6C8.5 6 7 8 6 10"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M6 19C7 21 9 23 13 23C15.5 23 17 21 18 19"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 10.5L12 4L20 10.5V20H4V10.5Z"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 20V12H15V20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

function BottomNav({ current, onChange, onReset }) {
  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const active = current === item.path;
        return (
          <button
            key={item.id}
            type="button"
            className={`${styles.item} ${active ? styles.active : ''}`}
            onClick={() => (item.id === 'reset' ? onReset?.() : onChange(item.path))}
          >
            <span className={styles.icon}>
              <Icon id={item.id} active={active} />
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
