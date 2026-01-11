import useGameStore from '../store/gameStore';
import Modal from './Modal';
import Button from './Button';
import styles from './OpportunityModal.module.css';

function rewardList(reward = {}) {
  const items = [];
  if (typeof reward.cashDelta === 'number') {
    items.push(`Кэш ${reward.cashDelta > 0 ? '+' : ''}$${Math.round(reward.cashDelta)}`);
  }
  if (typeof reward.salaryBonusDelta === 'number') {
    items.push(`Зарплата ${reward.salaryBonusDelta > 0 ? '+' : ''}$${Math.round(reward.salaryBonusDelta)}/мес`);
  }
  if (typeof reward.recurringDelta === 'number') {
    items.push(
      `Фикс. расходы ${reward.recurringDelta > 0 ? '+' : ''}$${Math.round(reward.recurringDelta)}/мес`,
    );
  }
  return items;
}

function OpportunityModal() {
  const opportunity = useGameStore((state) => state.opportunity);
  const cash = useGameStore((state) => state.cash);
  const resolveOpportunity = useGameStore((state) => state.resolveOpportunity);

  if (!opportunity) return null;
  const {
    title,
    description,
    cost,
    reward,
    penaltyOnDecline,
    mode,
    protectedBy,
  } = opportunity;
  const rewardItems = rewardList(reward);
  const penaltyItems = rewardList(penaltyOnDecline);
  const acceptDisabled = protectedBy || (cost ? cash < cost : false);
  const acceptLabel = mode === 'risk' ? 'Оплатить защиту' : 'Инвестировать';
  const declineLabel = mode === 'risk' ? 'Игнорировать' : 'Пропустить';

  return (
    <Modal
      open
      onClose={() => {}}
      title={title}
      footer={
        protectedBy ? (
          <Button variant="primary" onClick={() => resolveOpportunity('dismiss')}>
            Отлично
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={() => resolveOpportunity('decline')}>
              {penaltyOnDecline ? `${declineLabel}` : 'Пропустить'}
            </Button>
            <Button variant="primary" disabled={acceptDisabled} onClick={() => resolveOpportunity('accept')}>
              {acceptLabel} {cost ? `($${cost})` : ''}
            </Button>
          </>
        )
      }
    >
      <p className={styles.text}>{description}</p>
      {protectedBy && <p className={styles.safe}>Защита активна — штраф не применяется.</p>}
      {typeof cost === 'number' && !protectedBy && (
        <p className={styles.cost}>Стоимость действия: ${cost}</p>
      )}
      {opportunity.minCash && !protectedBy && (
        <p className={styles.hint}>Нужно минимум ${opportunity.minCash} свободных средств.</p>
      )}
      {!protectedBy && rewardItems.length > 0 && (
        <div className={styles.list}>
          <span>Эффект:</span>
          <ul>
            {rewardItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {!protectedBy && penaltyItems.length > 0 && (
        <div className={styles.list}>
          <span>Штраф при отказе:</span>
          <ul>
            {penaltyItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {acceptDisabled && !protectedBy && (
        <p className={styles.warn}>Нужно хотя бы ${cost} наличными, чтобы согласиться.</p>
      )}
    </Modal>
  );
}

export default OpportunityModal;
