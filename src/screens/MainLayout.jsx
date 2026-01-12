import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import useGameStore from '../store/gameStore';
import BottomNav from '../components/BottomNav';
import { calculateHoldingsValue, calculatePassiveIncome } from '../domain/finance';
import styles from './MainLayout.module.css';
import { spriteStyle, getProfessionIcon } from '../utils/iconSprite';

function StatusRibbon({ win, lose }) {
  if (!win && !lose) return null;
  const isWin = Boolean(win);
  const text = isWin ? `Победа: ${win.id}` : `Поражение: ${lose.id}`;
  return (
    <div className={`${styles.ribbon} ${isWin ? styles.win : styles.lose}`}>
      <span>{text}</span>
    </div>
  );
}

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const storeData = useGameStore(
    useShallow((state) => ({
      profession: state.profession,
      cash: state.cash,
      debt: state.debt,
      investments: state.investments,
      priceState: state.priceState,
      configs: state.configs,
      availableCredit: state.availableCredit,
      winCondition: state.winCondition,
      loseCondition: state.loseCondition,
      recurringExpenses: state.recurringExpenses,
    })),
  );
  const advanceMonth = useGameStore((state) => state.advanceMonth);
  const [finishPromptOpen, setFinishPromptOpen] = useState(false);

  const openFinishPrompt = () => setFinishPromptOpen(true);
  const handleFinishCancel = () => setFinishPromptOpen(false);
  const handleFinishConfirm = () => {
    setFinishPromptOpen(false);
    advanceMonth();
  };

  const instrumentMap = useMemo(() => {
    const list = storeData.configs?.instruments?.instruments || [];
    return list.reduce((acc, instrument) => {
      acc[instrument.id] = instrument;
      return acc;
    }, {});
  }, [storeData.configs]);

  const holdingsValue = useMemo(
    () => calculateHoldingsValue(storeData.investments, storeData.priceState),
    [storeData.investments, storeData.priceState],
  );

  const passiveIncome = useMemo(
    () => calculatePassiveIncome(storeData.investments, storeData.priceState, instrumentMap),
    [storeData.investments, storeData.priceState, instrumentMap],
  );

  const netWorth = storeData.cash + holdingsValue - storeData.debt;

  const formatMoney = (value) => {
    const rounded = Math.round(value);
    return `${rounded < 0 ? '-$' : '$'}${Math.abs(rounded).toLocaleString('en-US')}`;
  };
  return (
    <div className={styles.layout}>
      <div className={styles.backdrop} />
      <header className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <div className={styles.avatar} style={spriteStyle(getProfessionIcon(storeData.profession))} />
            <div>
              <span className={styles.professionLabel}>Текущая профессия</span>
              <strong className={styles.professionTitle}>{storeData.profession?.title || 'Профиль'}</strong>
            </div>
          </div>
          <div className={styles.headerStats}>
            <div>
              <span>Свободный кэш</span>
              <strong>{formatMoney(storeData.cash)}</strong>
            </div>
            <div>
              <span>Обязательства</span>
              <strong>{formatMoney(storeData.debt)}</strong>
            </div>
          </div>
        </div>
        <button
          type="button"
          className={styles.exitButton}
          onClick={() => navigate('/choose')}
          title="Сменить роль"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 7H19L18 21H6L5 7Z"
              stroke="#1f2d4a"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M9 7V4H15V7" stroke="#1f2d4a" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10 11V18" stroke="#1f2d4a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 11V18" stroke="#1f2d4a" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      <StatusRibbon win={storeData.winCondition} lose={storeData.loseCondition} />
      <main className={styles.content}>
        <Outlet />
      </main>
      {finishPromptOpen && (
        <div className={styles.finishOverlay}>
          <div className={styles.finishCard}>
            <h3>Завершить ход?</h3>
            <p>После подтверждения мы применим все эффекты месяца:</p>
            <ul>
              <li>
                <strong>Финансы.</strong>
                <span>Начислим зарплату и пассивный доход, удержим расходы и проценты по долгам.</span>
              </li>
              <li>
                <strong>Активы.</strong>
                <span>Пересчитаем стоимости портфеля, кредитный лимит и прочие показатели.</span>
              </li>
              <li>
                <strong>Сделки.</strong>
                <span>Продвинутся активные сделки и предложения, могут закрыться окна.</span>
              </li>
              <li>
                <strong>События.</strong>
                <span>Может произойти случайное событие месяца со своими эффектами.</span>
              </li>
            </ul>
            <div className={styles.finishActions}>
              <button type="button" onClick={handleFinishCancel} className={styles.finishCancel}>
                Остаться в месяце
              </button>
              <button type="button" onClick={handleFinishConfirm} className={styles.finishConfirm}>
                Подтвердить ход
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav current={location.pathname} onChange={navigate} onAdvance={openFinishPrompt} />
    </div>
  );
}

export default MainLayout;
