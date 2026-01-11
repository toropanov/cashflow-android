import { useMemo, useState } from 'react';
import useGameStore, { homeActions } from '../store/gameStore';
import Card from '../components/Card';
import GradientButton from '../components/GradientButton';
import Button from '../components/Button';
import Slider from '../components/Slider';
import styles from './Home.module.css';

function ActionCard({ action, onSelect, cash }) {
  const disabled = action.cost ? cash < action.cost : false;
  const buttonLabel = action.buttonText
    ? action.buttonText
    : action.cost
      ? `Оплатить $${action.cost}`
      : 'Активировать';
  return (
    <Card className={styles.actionCard}>
      <div className={styles.actionIcon}>
        <span />
      </div>
      <h3>{action.title}</h3>
      <p>{action.description}</p>
      <Button variant="primary" onClick={() => onSelect(action.id)} disabled={disabled}>
        {buttonLabel}
      </Button>
      {disabled && <span className={styles.hint}>Нужно ${action.cost}</span>}
    </Card>
  );
}

function LastTurn({ data, showReturns }) {
  if (!data) {
    return (
      <div className={styles.placeholder}>
        <p>Совершай действия и переходи к следующему месяцу, чтобы увидеть динамику.</p>
      </div>
    );
  }
  const formatter = (value) => `$${Math.round(value).toLocaleString('en-US')}`;
  const recurring = data.recurringExpenses || 0;
  const net =
    Math.round(data.salary + data.passiveIncome - data.livingCost - recurring - (data.debtInterest || 0));
  const entries = [
    { label: 'Зарплата', value: data.salary, positive: true },
    { label: 'Пассивно', value: data.passiveIncome, positive: true },
    { label: 'Бытовые', value: data.livingCost, positive: false },
    { label: 'Фикс.расходы', value: recurring, positive: false },
    { label: 'Проценты долга', value: data.debtInterest || 0, positive: false },
  ];
  return (
    <div className={styles.lastTurn}>
      {entries.map((entry) => (
        <div key={entry.label}>
          <span>{entry.label}</span>
          <strong className={entry.positive ? styles.valuePositive : styles.valueNegative}>
            {formatter(entry.value)}
          </strong>
        </div>
      ))}
      <div>
        <span>Доходность портфеля</span>
        <strong>
          {showReturns && Object.keys(data.returns || {}).length
            ? `${Math.round(
                (Object.values(data.returns).reduce((acc, value) => acc + value, 0) /
                  Object.keys(data.returns).length) *
                  100,
              )}%`
            : '—'}
        </strong>
      </div>
      <div className={styles.divider} />
      <div className={styles.netRow}>
        <span>Итог месяца</span>
        <strong className={net >= 0 ? styles.valuePositive : styles.valueNegative}>
          {formatter(net)}
        </strong>
      </div>
    </div>
  );
}

function Home() {
  const applyHomeAction = useGameStore((state) => state.applyHomeAction);
  const advanceMonth = useGameStore((state) => state.advanceMonth);
  const lastTurn = useGameStore((state) => state.lastTurn);
  const cash = useGameStore((state) => state.cash);
  const currentEvent = useGameStore((state) => state.currentEvent);
  const availableActions = useGameStore((state) => state.availableActions || homeActions);
  const hasInvestments = useGameStore((state) => Object.keys(state.investments || {}).length > 0);
  const drawCredit = useGameStore((state) => state.drawCredit);
  const serviceDebt = useGameStore((state) => state.serviceDebt);
  const debt = useGameStore((state) => state.debt);
  const creditLimit = useGameStore((state) => state.creditLimit);
  const availableCredit = useGameStore((state) => state.availableCredit);
  const [leverage, setLeverage] = useState(1.5);
  const baseDraw = 600;
  const creditAmount = useMemo(() => Math.round(baseDraw * leverage), [leverage]);

  return (
    <div className={styles.screen}>
      <Card className={styles.card}>
        <header>
          <h3>Результат последнего месяца</h3>
        </header>
        <LastTurn data={lastTurn} showReturns={hasInvestments} />
      </Card>
      {currentEvent && (
        <Card className={styles.eventCard}>
          <div>
            <p className={styles.eventTitle}>{currentEvent.title}</p>
            <span>{currentEvent.message || currentEvent.description}</span>
          </div>
        </Card>
      )}
      <Card className={styles.creditCard}>
        <div className={styles.creditHeader}>
          <div>
            <span>Долг</span>
            <strong>${Math.round(debt).toLocaleString('en-US')}</strong>
          </div>
          <div>
            <span>Доступно</span>
            <strong>${Math.round(Math.max(availableCredit, 0)).toLocaleString('en-US')}</strong>
          </div>
        </div>
        <Slider
          min={1}
          max={4}
          step={0.5}
          value={leverage}
          onChange={setLeverage}
          label={`Плечо ×${leverage.toFixed(1)}`}
        />
        <div className={styles.creditActions}>
          <Button
            variant="primary"
            onClick={() => drawCredit(creditAmount)}
            disabled={availableCredit <= 0}
          >
            Взять ${creditAmount}
          </Button>
          <Button
            variant="ghost"
            onClick={() => serviceDebt(creditAmount)}
            disabled={debt <= 0 || cash <= 0}
          >
            Погасить ${creditAmount}
          </Button>
        </div>
      </Card>
      <section>
        <h2>Ходы месяца</h2>
        <div className={styles.grid}>
          {availableActions.map((action) => (
            <ActionCard key={action.id} action={action} onSelect={applyHomeAction} cash={cash} />
          ))}
        </div>
      </section>
      <GradientButton onClick={advanceMonth}>Следующий месяц</GradientButton>
    </div>
  );
}

export default Home;
