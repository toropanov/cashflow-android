import useGameStore from '../store/gameStore';
import Card from '../components/Card';
import SparkLine from '../components/SparkLine';
import { buildPortfolioSummary } from '../domain/finance';
import styles from './Stats.module.css';

const assetColors = {
  STOCKS_US: ['#d7a6ff', '#73c9ff'],
  CRYPTO: ['#ff9ada', '#6df6c4'],
  BONDS_US: ['#b6f7b1', '#7ec9ff'],
};

function StatCard({ title, subtitle, data, accent }) {
  return (
    <Card className={styles.statCard}>
      <header>
        <div>
          <p>{subtitle}</p>
          <h3>{title}</h3>
        </div>
      </header>
      <div className={styles.chart}>
        <SparkLine data={data} colorStart={accent[0]} colorStop={accent[1]} />
      </div>
    </Card>
  );
}

function Allocation({ rows }) {
  if (!rows.length) {
    return <p className={styles.placeholder}>Нет позиций — начни инвестировать.</p>;
  }
  return rows.map((row) => (
    <div key={row.id} className={styles.allocationRow}>
      <div className={styles.allocationHeader}>
        <span>{row.title}</span>
        <strong>{Math.round(row.allocation * 100)}%</strong>
      </div>
      <div className={styles.progress}>
        <div style={{ width: `${row.allocation * 100}%` }} />
      </div>
      <p>${Math.round(row.value).toLocaleString('en-US')}</p>
    </div>
  ));
}

function Stats() {
  const history = useGameStore((state) => state.history);
  const investments = useGameStore((state) => state.investments);
  const priceState = useGameStore((state) => state.priceState);
  const instruments = useGameStore(
    (state) => state.configs?.instruments?.instruments || [],
  );

  const allocationRows = buildPortfolioSummary(investments, priceState, instruments);
  const assetCharts = instruments.map((instrument) => ({
    instrument,
    id: instrument.id,
    price: priceState[instrument.id]?.price || instrument.initialPrice,
    history: priceState[instrument.id]?.history || [],
  }));

  return (
    <div className={styles.screen}>
      <div className={styles.grid}>
        <StatCard
          title="Net Worth"
          subtitle="Общая кривая"
          data={history.netWorth}
          accent={['#b17bff', '#66e8f4']}
        />
        <StatCard
          title="Cash Flow"
          subtitle="Доход-расход"
          data={history.cashFlow}
          accent={['#6df6c4', '#6f9bff']}
        />
        <StatCard
          title="Passive Income"
          subtitle="Дивиденды/купон"
          data={history.passiveIncome}
          accent={['#ff9bba', '#6ea3ff']}
        />
      </div>
      <Card className={styles.allocationCard}>
        <header>
          <h3>Аллокация портфеля</h3>
          <span>Градиент под линией, мягкая сетка</span>
        </header>
        <div className={styles.allocationList}>
          <Allocation rows={allocationRows} />
        </div>
      </Card>
      <div className={styles.assetGrid}>
        {assetCharts.map((asset) => {
          const palette = assetColors[asset.id] || ['#c7d9ff', '#6ef3ff'];
          return (
            <Card key={asset.id} className={styles.assetCard}>
              <div className={styles.assetHeader}>
                <div>
                  <p>{asset.instrument.type.toUpperCase()}</p>
                  <h3>{asset.instrument.title}</h3>
                </div>
                <strong>${Math.round(asset.price).toLocaleString('en-US')}</strong>
              </div>
              <SparkLine data={asset.history} colorStart={palette[0]} colorStop={palette[1]} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Stats;
