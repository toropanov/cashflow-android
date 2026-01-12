import { useNavigate } from 'react-router-dom';
import styles from './AssetsSectionSwitch.module.css';

const SECTIONS = [
  {
    id: 'investments',
    label: 'Инвестиции',
    description: 'Следи за портфелем и кредитом',
    path: '/app/bank',
  },
  {
    id: 'deals',
    label: 'Сделки',
    description: 'Лови окна возможностей',
    path: '/app/deals',
  },
];

function AssetsSectionSwitch({ active }) {
  const navigate = useNavigate();
  return (
    <div className={styles.split}>
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`${styles.card} ${active === section.id ? styles.cardActive : ''}`}
          onClick={() => navigate(section.path)}
        >
          <div>
            <span>{section.label}</span>
            <p>{section.description}</p>
          </div>
          <i aria-hidden="true">&gt;</i>
        </button>
      ))}
    </div>
  );
}

export default AssetsSectionSwitch;
