import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import Card from '../components/Card';
import Button from '../components/Button';
import GradientButton from '../components/GradientButton';
import styles from './ProfessionSelect.module.css';

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Лёгкий', description: 'Реже негативные события.' },
  { id: 'normal', label: 'Стандарт', description: 'Баланс риска и наград.' },
  { id: 'hard', label: 'Сложный', description: 'Больше стрессов и испытаний.' },
];

function summarizeGoal(rule) {
  if (!rule) {
    return { title: rule?.id || '', detail: '' };
  }
  if (rule.type === 'passive_income_cover_costs') {
    return {
      title: 'Пассивный > расходов',
      detail: `Удержать ${rule.requiredStreakMonths || 1} ходов`,
    };
  }
  if (rule.type === 'net_worth_reach') {
    const target = `$${(rule.target || 0).toLocaleString('en-US')}`;
    return {
      title: `Чистый капитал ${target}`,
      detail: `Финализируй ${rule.requiredStreakMonths || 1} ходов`,
    };
  }
  return { title: rule.id, detail: '' };
}

function ProfCard({ profession, onSelect }) {
  return (
    <Card className={styles.profCard}>
      <div className={styles.avatar}>
        <span>{profession.title.slice(0, 1)}</span>
      </div>
      <h3>{profession.title}</h3>
      <p className={styles.sub}>Стартовые цифры</p>
      <div className={styles.metrics}>
        <div>
          <span>Зарплата</span>
          <strong>${profession.salaryMonthly.toLocaleString('en-US')}</strong>
        </div>
        <div>
          <span>Свободный кэш</span>
          <strong>${profession.startingMoney.toLocaleString('en-US')}</strong>
        </div>
      </div>
      <Button variant="primary" onClick={() => onSelect(profession.id)}>
        Играть
      </Button>
    </Card>
  );
}

function ProfessionSelect() {
  const professions = useGameStore(
    (state) => state.configs?.professions?.professions || [],
  );
  const winRules = useGameStore((state) => state.configs?.rules?.win || []);
  const storedGoalId = useGameStore((state) => state.selectedGoalId);
  const storedDifficulty = useGameStore((state) => state.difficulty || 'normal');
  const selectProfession = useGameStore((state) => state.selectProfession);
  const randomProfession = useGameStore((state) => state.randomProfession);
  const navigate = useNavigate();

  const ordered = useMemo(
    () => [...professions].sort((a, b) => a.salaryMonthly - b.salaryMonthly),
    [professions],
  );
  const [goalId, setGoalId] = useState(storedGoalId || winRules[0]?.id || null);
  const [difficulty, setDifficulty] = useState(storedDifficulty);

  useEffect(() => {
    if (!goalId && winRules[0]) {
      setGoalId(winRules[0].id);
    }
  }, [winRules, goalId]);

  useEffect(() => {
    if (storedGoalId && storedGoalId !== goalId) {
      setGoalId(storedGoalId);
    }
  }, [storedGoalId]);

  useEffect(() => {
    if (storedDifficulty && storedDifficulty !== difficulty) {
      setDifficulty(storedDifficulty);
    }
  }, [storedDifficulty]);

  const effectiveGoalId = goalId || winRules[0]?.id || null;
  const effectiveDifficulty = difficulty || 'normal';

  const handleSelect = (id) => {
    selectProfession(id, { goalId: effectiveGoalId, difficulty: effectiveDifficulty });
    navigate('/app');
  };

  const handleRandom = () => {
    randomProfession({ goalId: effectiveGoalId, difficulty: effectiveDifficulty });
    navigate('/app');
  };

  return (
    <div className={styles.screen}>
      <div className={styles.hero}>
        <p>Выбери роль</p>
        <h1>Кем ты стартуешь в Capetica?</h1>
        <span>Каждая профессия — своя динамика кэша, расходов и кредитного лайна.</span>
      </div>
      {winRules.length > 0 && (
        <div className={styles.options}>
          <section className={styles.optionGroup}>
            <h2>Цель партии</h2>
            <div className={styles.optionList}>
              {winRules.map((rule) => {
                const summary = summarizeGoal(rule);
                const active = effectiveGoalId === rule.id;
                return (
                  <button
                    key={rule.id}
                    type="button"
                    className={`${styles.optionButton} ${active ? styles.optionButtonActive : ''}`}
                    onClick={() => setGoalId(rule.id)}
                  >
                    <strong>{summary.title}</strong>
                    <small>{summary.detail}</small>
                  </button>
                );
              })}
            </div>
          </section>
          <section className={styles.optionGroup}>
            <h2>Сложность</h2>
            <div className={styles.optionList}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.optionButton} ${difficulty === option.id ? styles.optionButtonActive : ''}`}
                  onClick={() => setDifficulty(option.id)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
      <div className={styles.cards}>
        {ordered.map((profession) => (
          <ProfCard key={profession.id} profession={profession} onSelect={handleSelect} />
        ))}
      </div>
      <GradientButton onClick={handleRandom}>Случайно</GradientButton>
      <div className={styles.sparkles}>
        <span />
        <span />
      </div>
    </div>
  );
}

export default ProfessionSelect;
