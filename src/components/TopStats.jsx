import { useEffect, useRef, useState } from 'react';
import Card from './Card';
import styles from './TopStats.module.css';

function AnimatedValue({ value, accent }) {
  const [bump, setBump] = useState(false);
  useEffect(() => {
    setBump(true);
    const timer = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(timer);
  }, [value]);
  return (
    <strong className={bump ? styles.bump : ''} style={{ color: accent }}>
      {value}
    </strong>
  );
}

function Metric({ label, rawValue, accent, formatter }) {
  const prev = useRef(rawValue);
  const [delta, setDelta] = useState(null);
  useEffect(() => {
    if (prev.current === rawValue) return;
    const diff = rawValue - prev.current;
    prev.current = rawValue;
    if (!Number.isFinite(diff) || diff === 0) return;
    setDelta(diff);
    const timer = setTimeout(() => setDelta(null), 1200);
    return () => clearTimeout(timer);
  }, [rawValue]);
  const formatted = formatter ? formatter(rawValue) : rawValue;
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <AnimatedValue value={formatted} accent={accent} />
      {delta !== null && (
        <span className={`${styles.delta} ${delta > 0 ? styles.deltaPositive : styles.deltaNegative}`}>
          {delta > 0 ? '+' : '-'}$
          {Math.abs(Math.round(delta)).toLocaleString('en-US')}
        </span>
      )}
    </div>
  );
}

const formatMoney = (value) => {
  const rounded = Math.round(value);
  return `${rounded < 0 ? '-$' : '$'}${Math.abs(rounded).toLocaleString('en-US')}`;
};

function TopStats({ month, netWorth, cash, passiveIncome, debt, availableCredit, recurringExpenses }) {
  const monthLabel = `Месяц ${month}`;
  const formatMonthly = (value) => `${formatMoney(value)}/мес`;
  const netPrev = useRef(netWorth);
  const [netDelta, setNetDelta] = useState(null);
  useEffect(() => {
    if (netPrev.current === netWorth) return;
    const diff = netWorth - netPrev.current;
    netPrev.current = netWorth;
    if (!Number.isFinite(diff) || diff === 0) return;
    setNetDelta(diff);
    const timer = setTimeout(() => setNetDelta(null), 1200);
    return () => clearTimeout(timer);
  }, [netWorth]);
  return (
    <section className={styles.wrapper}>
      <div className={styles.heading}>
        <p>{monthLabel}</p>
        <span>Баланс</span>
      </div>
      <Card className={styles.primaryCard}>
        <div className={styles.netWorthLabel}>Чистая стоимость</div>
        <div className={styles.netWorthValueRow}>
          <div className={styles.netWorthValue}>
            <AnimatedValue value={formatMoney(netWorth)} accent="#fefefe" />
          </div>
          {netDelta !== null && (
            <span
              className={`${styles.delta} ${netDelta > 0 ? styles.deltaPositive : styles.deltaNegative}`}
            >
              {netDelta > 0 ? '+' : '-'}$
              {Math.abs(Math.round(netDelta)).toLocaleString('en-US')}
            </span>
          )}
        </div>
        <div className={styles.metricsGrid}>
          <Metric
            label="Наличные"
            rawValue={cash}
            accent="#a469ff"
            formatter={formatMoney}
          />
          <Metric
            label="Пассивный доход"
            rawValue={passiveIncome}
            accent="#59dabf"
            formatter={formatMonthly}
          />
          <Metric
            label="Долг"
            rawValue={debt}
            accent="#ff9b9b"
            formatter={formatMoney}
          />
          <Metric
            label="Кредитлайн"
            rawValue={availableCredit}
            accent="#7bd7ff"
            formatter={formatMoney}
          />
          <Metric
            label="Фикс. расходы"
            rawValue={recurringExpenses}
            accent="#f2c265"
            formatter={formatMonthly}
          />
        </div>
      </Card>
    </section>
  );
}

export default TopStats;
