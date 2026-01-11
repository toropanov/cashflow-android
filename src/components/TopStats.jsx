import Card from './Card';
import styles from './TopStats.module.css';

function Metric({ label, value, accent }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong style={{ color: accent }}>{value}</strong>
    </div>
  );
}

function TopStats({ month, netWorth, cash, passiveIncome, debt, availableCredit, recurringExpenses }) {
  const monthLabel = `Месяц ${month}`;
  const formattedNetWorth = `$${Math.round(netWorth).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
  const formattedCash = `$${Math.round(cash).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const formattedPassive = `$${Math.round(passiveIncome).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}/мес`;
  const formattedDebt = `$${Math.round(debt).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const formattedCredit = `$${Math.round(availableCredit).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
  const formattedRecurring = `$${Math.round(recurringExpenses || 0).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}/мес`;
  return (
    <section className={styles.wrapper}>
      <div className={styles.heading}>
        <p>{monthLabel}</p>
        <span>Баланс стратегии</span>
      </div>
      <Card className={styles.primaryCard}>
        <div className={styles.netWorthLabel}>Чистая стоимость</div>
        <div className={styles.netWorthValue}>{formattedNetWorth}</div>
        <div className={styles.metricsGrid}>
          <Metric label="Наличные" value={formattedCash} accent="#a469ff" />
          <Metric label="Пассивный доход" value={formattedPassive} accent="#59dabf" />
          <Metric label="Долг" value={formattedDebt} accent="#ff9b9b" />
          <Metric label="Кредитлайн" value={formattedCredit} accent="#7bd7ff" />
          <Metric label="Фикс. расходы" value={formattedRecurring} accent="#f2c265" />
        </div>
      </Card>
    </section>
  );
}

export default TopStats;
