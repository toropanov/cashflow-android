import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { seedPriceState, simulateMarkets } from '../domain/marketSimulator';
import {
  getProfessionById,
  computeLivingCost,
  computeCreditLimit,
  calculateHoldingsValue,
  calculatePassiveIncome,
  evaluateGoals,
} from '../domain/finance';
import { ensureSeed, uniformFromSeed } from '../domain/rng';

const RNG_STORAGE_KEY = 'finstrategy_rng_seed';
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
const hydratedStorage = createJSONStorage(() =>
  typeof window === 'undefined' ? noopStorage : window.localStorage,
);

const HOME_ACTIONS = [
  {
    id: 'side_hustle',
    title: 'Франшиза кофе',
    description: 'Оплата наставника → +$250 к зарплате со следующего месяца.',
    cost: 250,
    effect: 'salary_up',
    value: 250,
  },
  {
    id: 'debt_payment',
    title: 'Погашение долга',
    description: 'Закрыть до 30% долга — облегчает будущие проценты.',
    effect: 'debt_down',
  },
  {
    id: 'skill_invest',
    title: 'Интенсив навыков',
    description: 'Платное обучение → +$400 к зарплате ежемесячно.',
    cost: 600,
    effect: 'salary_up',
    value: 400,
  },
  {
    id: 'optimize_expenses',
    title: 'Анти-подписки',
    description: 'За один вечер отменяешь лишнее — расходы падают на $120/мес.',
    cost: 320,
    effect: 'expense_down',
    value: 120,
  },
  {
    id: 'health_plan',
    title: 'Премиум страховка',
    description: 'Платишь фиксированно и избегаешь медсчётов.',
    cost: 350,
    effect: 'protection',
    protectionKey: 'healthPlan',
  },
  {
    id: 'wellness',
    title: 'Mind&Body выходные',
    description: 'Минус стресс, траты становятся ниже на $80.',
    cost: 180,
    effect: 'cost_down',
    value: 80,
  },
  {
    id: 'legal_consult',
    title: 'Финансовый юрист',
    description: 'Разовый платёж → защита от проверок.',
    cost: 280,
    effect: 'protection',
    protectionKey: 'legalShield',
  },
  {
    id: 'equipment_plan',
    title: 'Сервис гаджетов',
    description: 'Ежемесячное ТО техники — защищает от поломок.',
    cost: 220,
    effect: 'protection',
    protectionKey: 'techShield',
  },
];

const OPPORTUNITY_LIBRARY = [
  {
    id: 'angel_round',
    mode: 'gain',
    title: 'Ангельский сигнал',
    description: 'Фонд хочет соинвестировать. Вложи $700 — получишь долю и премию.',
    cost: 700,
    reward: { cashDelta: 1500, salaryBonusDelta: 180 },
    minCash: 700,
  },
  {
    id: 'medical_bill',
    mode: 'risk',
    title: 'Счёт из клиники',
    description: 'Без страховки платёж $950. Можно оплатить $350 сейчас и закрыть вопрос.',
    cost: 350,
    penaltyOnDecline: { cashDelta: -950 },
    protectionKey: 'healthPlan',
  },
  {
    id: 'tax_audit',
    mode: 'risk',
    title: 'Налоговая проверка',
    description: 'Юрист отобьёт штраф за $320. Иначе потеряешь $1100.',
    cost: 320,
    penaltyOnDecline: { cashDelta: -1100 },
    protectionKey: 'legalShield',
  },
  {
    id: 'green_energy',
    mode: 'gain',
    title: 'Зелёная энергия',
    description: 'Ставишь панели за $500 — коммуналка падает на $90/мес.',
    cost: 500,
    reward: { recurringDelta: -90 },
    minCash: 500,
  },
  {
    id: 'device_break',
    mode: 'risk',
    title: 'Поломка техники',
    description: 'Сервисный контракт $240 или ремонт на $800.',
    cost: 240,
    penaltyOnDecline: { cashDelta: -800 },
    protectionKey: 'techShield',
  },
  {
    id: 'mentor_slot',
    mode: 'gain',
    title: 'Менторский слот',
    description: 'Час с топ-ментором за $450 даёт постоянный буст дохода.',
    cost: 450,
    reward: { salaryBonusDelta: 260 },
    minCash: 450,
  },
];

const roundMoney = (value) => Math.round(value ?? 0);

function rollMonthlyActions(seed, count = 4) {
  const pool = HOME_ACTIONS.map((item) => item.id);
  let cursor = seed ?? ensureSeed();
  const picked = new Set();
  while (picked.size < Math.min(count, pool.length)) {
    const roll = uniformFromSeed(cursor);
    cursor = roll.seed;
    const index = Math.min(pool.length - 1, Math.floor(roll.value * pool.length));
    picked.add(pool[index]);
  }
  const actions = HOME_ACTIONS.filter((item) => picked.has(item.id));
  return { actions, seed: cursor };
}

function applyOutcomeToState(state, outcome = {}) {
  const patch = {};
  if (typeof outcome.cashDelta === 'number') {
    patch.cash = roundMoney(state.cash + outcome.cashDelta);
  }
  if (typeof outcome.salaryBonusDelta === 'number') {
    patch.salaryBonus = roundMoney(state.salaryBonus + outcome.salaryBonusDelta);
  }
  if (typeof outcome.recurringDelta === 'number') {
    const next = Math.max(0, roundMoney((state.recurringExpenses || 0) + outcome.recurringDelta));
    patch.recurringExpenses = next;
  }
  return patch;
}

function rollOpportunity(state, seed) {
  if (!OPPORTUNITY_LIBRARY.length) {
    return { opportunity: null, seed };
  }
  let cursorSeed = seed;
  const pickRoll = uniformFromSeed(cursorSeed);
  cursorSeed = pickRoll.seed;
  const index = Math.min(
    OPPORTUNITY_LIBRARY.length - 1,
    Math.floor(pickRoll.value * OPPORTUNITY_LIBRARY.length),
  );
  const template = OPPORTUNITY_LIBRARY[index];
  const protectedBy =
    template.protectionKey && state.protections?.[template.protectionKey] ? template.protectionKey : null;
  return {
    opportunity: {
      ...template,
      protectedBy,
      createdAt: state.month + 1,
    },
    seed: cursorSeed,
  };
}

function getInstrumentMap(configs) {
  const list = configs?.instruments?.instruments || [];
  return list.reduce((acc, instrument) => {
    acc[instrument.id] = instrument;
    return acc;
  }, {});
}

function ensureStoredSeed() {
  if (typeof window === 'undefined') {
    return ensureSeed();
  }
  const existing = window.localStorage.getItem(RNG_STORAGE_KEY);
  if (existing) {
    return ensureSeed(Number(existing));
  }
  const generated = ensureSeed(Math.floor(Math.random() * 0xffffffff));
  window.localStorage.setItem(RNG_STORAGE_KEY, `${generated}`);
  return generated;
}

function buildProfessionState(baseState, profession) {
  if (!profession) return {};
  const instrumentList = baseState.configs?.instruments?.instruments || [];
  const seededPrices = seedPriceState(instrumentList);
  const holdings = {};
  Object.entries(profession.startingPortfolio || {}).forEach(([instrumentId, units]) => {
    holdings[instrumentId] = {
      units,
      costBasis: (seededPrices[instrumentId]?.price || 0) * units,
    };
  });
  const livingBase = computeLivingCost(profession.id, baseState.configs?.rules);
  const cash = profession.startingMoney || 0;
  const debt = profession.startingDebt || 0;
  const holdingsValue = calculateHoldingsValue(holdings, seededPrices);
  const netWorth = cash + holdingsValue - debt;
  const salary = profession.salaryMonthly || 0;
  const recurringExpenses = Math.max(0, Math.round(profession.monthlyExpenses || livingBase * 0.4));
  const creditLimit = computeCreditLimit({
    profession,
    netWorth,
    salary,
    rules: baseState.configs?.rules,
  });
  return {
    profession,
    professionId: profession.id,
    month: 0,
    cash,
    debt,
    baseLivingCost: livingBase,
    lifestyleModifier: 0,
    livingCost: livingBase,
    salaryBonus: 0,
    recurringExpenses,
    protections: {
      healthPlan: false,
      legalShield: false,
      techShield: false,
    },
    investments: holdings,
    priceState: seededPrices,
    shockState: {},
    trackers: { win: {}, lose: {} },
    winCondition: null,
    loseCondition: null,
    history: {
      netWorth: [{ month: 0, value: netWorth }],
      cashFlow: [],
      passiveIncome: [],
    },
    creditLimit,
    availableCredit: creditLimit - debt,
    lastTurn: null,
    recentLog: [],
    opportunity: null,
    availableActions: HOME_ACTIONS.slice(0, 4),
  };
}

function clampHistory(arr = [], cap = 120) {
  if (arr.length <= cap) return arr;
  return arr.slice(arr.length - cap);
}

function handleHomeAction(actionId, state) {
  const action = HOME_ACTIONS.find((item) => item.id === actionId);
  if (!action) return { patch: {}, message: '' };
  if (action.id === 'debt_payment') {
    if (state.debt <= 0 || state.cash <= 100) {
      return { patch: {}, message: 'Нечего гасить.' };
    }
    const budget = Math.min(Math.round(state.cash * 0.3), state.cash);
    const payment = Math.min(budget, state.debt);
    const nextCash = roundMoney(state.cash - payment);
    const nextDebt = Math.max(0, roundMoney(state.debt - payment));
    return {
      patch: { cash: nextCash, debt: nextDebt },
      message: `Закрыто $${payment.toFixed(0)} долга`,
    };
  }
  if (action.cost && state.cash < action.cost) {
    return { patch: {}, message: `Нужно $${action.cost}` };
  }
  const patch = {};
  if (action.cost) {
    patch.cash = roundMoney(state.cash - action.cost);
  }
  let message = '';
  switch (action.effect) {
    case 'salary_up': {
      const delta = action.value || 0;
      patch.salaryBonus = roundMoney(state.salaryBonus + delta);
      message = `Зарплата вырастет на $${delta}`;
      break;
    }
    case 'expense_down': {
      const drop = action.value || 0;
      const nextRecurring = Math.max(
        0,
        roundMoney((patch.recurringExpenses ?? state.recurringExpenses) - drop),
      );
      patch.recurringExpenses = nextRecurring;
      message = `Фикс.расходы -$${drop}`;
      break;
    }
    case 'cost_down': {
      const relief = action.value || 0;
      const nextModifier = Math.max(0, state.lifestyleModifier - relief);
      patch.lifestyleModifier = nextModifier;
      patch.livingCost = state.baseLivingCost + nextModifier;
      message = 'Стресс снят — расходы ниже.';
      break;
    }
    case 'protection': {
      patch.protections = {
        ...state.protections,
        [action.protectionKey]: true,
      };
      message = 'Защита активирована.';
      break;
    }
    default:
      break;
  }
  if (!message) {
    message = 'Улучшение применено.';
  }
  return { patch, message };
}

const useGameStore = create(
  persist(
    (set, get) => ({
      configs: null,
      configsReady: false,
      rngSeed: null,
      profession: null,
      professionId: null,
      month: 0,
      cash: 0,
      debt: 0,
      baseLivingCost: 0,
      livingCost: 0,
      lifestyleModifier: 0,
      salaryBonus: 0,
      recurringExpenses: 0,
      protections: { healthPlan: false, legalShield: false, techShield: false },
      investments: {},
      priceState: {},
      shockState: {},
      history: { netWorth: [], cashFlow: [], passiveIncome: [] },
      trackers: { win: {}, lose: {} },
      winCondition: null,
      loseCondition: null,
      creditLimit: 0,
      availableCredit: 0,
      lastTurn: null,
      recentLog: [],
      opportunity: null,
      availableActions: HOME_ACTIONS.slice(0, 4),
      bootstrapFromConfigs: (bundle) =>
        set((state) => {
          const rngSeed = state.rngSeed ?? ensureStoredSeed();
          const priceState =
            Object.keys(state.priceState || {}).length > 0
              ? state.priceState
              : seedPriceState(bundle?.instruments?.instruments);
          return {
            configs: bundle,
            configsReady: true,
            rngSeed,
            priceState,
            availableActions: state.availableActions?.length
              ? state.availableActions
              : HOME_ACTIONS.slice(0, 4),
          };
        }),
      selectProfession: (professionId) =>
        set((state) => {
          if (!state.configsReady) return {};
          const profession = getProfessionById(
            state.configs.professions,
            professionId,
          );
          if (!profession) return {};
          const actionRoll = rollMonthlyActions(state.rngSeed || ensureStoredSeed());
          const base = buildProfessionState(state, profession);
          return {
            ...base,
            availableActions: actionRoll.actions,
            rngSeed: actionRoll.seed,
          };
        }),
      randomProfession: () =>
        set((state) => {
          const list = state.configs?.professions?.professions || [];
          if (!list.length) return {};
          const roll = uniformFromSeed(state.rngSeed || ensureStoredSeed());
          const index = Math.min(
            list.length - 1,
            Math.floor(roll.value * list.length),
          );
          const profession = list[index];
          const actionRoll = rollMonthlyActions(roll.seed);
          return {
            ...buildProfessionState(state, profession),
            availableActions: actionRoll.actions,
            rngSeed: actionRoll.seed,
          };
        }),
      advanceMonth: () =>
        set((state) => {
          if (!state.profession || !state.configsReady) return {};
          const instrumentList = state.configs.instruments.instruments || [];
          const simResult = simulateMarkets({
            month: state.month,
            priceState: state.priceState,
            instruments: instrumentList,
            marketsConfig: state.configs.markets,
            rngSeed: state.rngSeed,
            shockState: state.shockState,
          });
          const priceState = simResult.priceState;
          const rngSeed = simResult.rngSeed;
          const shockState = simResult.shockState;
          const instrumentMap = getInstrumentMap(state.configs);
          const holdingsValue = calculateHoldingsValue(
            state.investments,
            priceState,
          );
          const passiveIncomeRaw = calculatePassiveIncome(
            state.investments,
            priceState,
            instrumentMap,
          );
          const passiveIncome = roundMoney(passiveIncomeRaw);
          const salary = roundMoney(
            (state.profession.salaryMonthly || 0) + state.salaryBonus,
          );
          const livingCost = Math.max(
            0,
            roundMoney((state.baseLivingCost || 0) + state.lifestyleModifier),
          );
          const recurringExpenses = roundMoney(state.recurringExpenses || 0);
          const monthlyRate =
            (state.configs.rules?.loans?.apr || 0) / 12;
          const debtInterest = roundMoney(state.debt * monthlyRate);
          const debt = Math.max(0, roundMoney(state.debt + debtInterest));
          const cash = roundMoney(
            state.cash + salary + passiveIncome - livingCost - recurringExpenses,
          );
          const netWorth = cash + holdingsValue - debt;
          const creditLimit = computeCreditLimit({
            profession: state.profession,
            netWorth,
            salary,
            rules: state.configs.rules,
          });
          const availableCredit = creditLimit - debt;
          const metrics = {
            passiveIncome,
            livingCost,
            recurringExpenses,
            netWorth,
            cash,
            availableCredit,
            monthlyCashFlow: salary + passiveIncome - livingCost - recurringExpenses,
            debtDelta: debtInterest,
            debt,
          };
          const goalState = evaluateGoals(
            { rules: state.configs.rules, trackers: state.trackers },
            metrics,
          );
          const netHistory = clampHistory([
            ...(state.history.netWorth || []),
            { month: state.month + 1, value: netWorth },
          ]);
          const cashFlowHistory = clampHistory([
            ...(state.history.cashFlow || []),
            { month: state.month + 1, value: metrics.monthlyCashFlow },
          ]);
          const passiveHistory = clampHistory([
            ...(state.history.passiveIncome || []),
            { month: state.month + 1, value: passiveIncome },
          ]);
          const opportunityRoll = rollOpportunity(
            { ...state, month: state.month, protections: state.protections, cash },
            rngSeed,
          );
          const actionsRoll = rollMonthlyActions(opportunityRoll.seed);
          const nextOpportunity = opportunityRoll.opportunity;
          return {
            month: state.month + 1,
            cash,
            debt,
            priceState,
            rngSeed: actionsRoll.seed,
            shockState,
            livingCost,
            opportunity: nextOpportunity,
            availableActions: actionsRoll.actions,
            history: {
              netWorth: netHistory,
              cashFlow: cashFlowHistory,
              passiveIncome: passiveHistory,
            },
            creditLimit,
            availableCredit,
            trackers: goalState.trackers,
            winCondition: state.winCondition || goalState.win,
            loseCondition: state.loseCondition || goalState.lose,
            lastTurn: {
              salary,
              passiveIncome,
              livingCost,
              recurringExpenses,
              debtInterest,
              returns: simResult.returns,
            },
          };
        }),
      buyInstrument: (instrumentId, desiredAmount) =>
        set((state) => {
          const instrument =
            getInstrumentMap(state.configs)[instrumentId];
          const price = state.priceState[instrumentId]?.price;
          if (!instrument || !price || desiredAmount <= 0) {
            return {};
          }
          const feePct = instrument.trading?.buyFeePct || 0;
          const minOrder = instrument.trading?.minOrder || 0;
          const maxSpendable = Math.min(desiredAmount, state.cash / (1 + feePct));
          if (maxSpendable < minOrder) {
            return {};
          }
          const spend = Math.max(minOrder, maxSpendable);
          if (spend <= 0) {
            return {};
          }
          const fee = spend * feePct;
          if (spend + fee > state.cash + 1e-3) {
            return {};
          }
          const units = spend / price;
          if (units <= 0) return {};
          const nextInvestments = { ...state.investments };
          const existing = nextInvestments[instrumentId] || {
            units: 0,
            costBasis: 0,
          };
          const newUnits = existing.units + units;
          const totalCost =
            existing.costBasis * existing.units + spend;
          nextInvestments[instrumentId] = {
            units: newUnits,
            costBasis: totalCost / newUnits,
          };
          return {
            investments: nextInvestments,
            cash: state.cash - (spend + fee),
          };
        }),
      sellInstrument: (instrumentId, desiredAmount) =>
        set((state) => {
          const instrument =
            getInstrumentMap(state.configs)[instrumentId];
          const holding = state.investments[instrumentId];
          const price = state.priceState[instrumentId]?.price;
          if (!instrument || !holding || !price || desiredAmount <= 0) {
            return {};
          }
          const maxValue = holding.units * price;
          if (maxValue <= 0) return {};
          const gross = Math.min(desiredAmount, maxValue);
          const unitsToSell = gross / price;
          const feePct = instrument.trading?.sellFeePct || 0;
          const fee = gross * feePct;
          const netProceeds = gross - fee;
          const remainingUnits = holding.units - unitsToSell;
          const nextInvestments = { ...state.investments };
          if (remainingUnits <= 0.0001) {
            delete nextInvestments[instrumentId];
          } else {
            nextInvestments[instrumentId] = {
              ...holding,
              units: remainingUnits,
            };
          }
          return {
            investments: nextInvestments,
            cash: state.cash + netProceeds,
          };
        }),
      resolveOpportunity: (decision) =>
        set((state) => {
          const card = state.opportunity;
          if (!card) return {};
          const baseLog = state.recentLog || [];
          const logEntry = {
            id: `opp-${card.id}-${Date.now()}`,
            month: state.month,
            text: '',
          };
          let patch = {};
          if (card.protectedBy) {
            const protections = {
              ...state.protections,
              [card.protectedBy]: false,
            };
            logEntry.text = `${card.title}: защита всё покрыла`;
            return {
              opportunity: null,
              protections,
              recentLog: [logEntry, ...baseLog].slice(0, 5),
            };
          }
          if (decision === 'accept') {
            if (card.cost && state.cash < card.cost) {
              return {};
            }
            if (card.cost) {
              patch.cash = roundMoney(state.cash - card.cost);
            }
            patch = {
              ...patch,
              ...applyOutcomeToState({ ...state, ...patch }, card.reward),
            };
            logEntry.text = `Принято: ${card.title}`;
          } else {
            if (card.penaltyOnDecline) {
              patch = {
                ...patch,
                ...applyOutcomeToState(state, card.penaltyOnDecline),
              };
              logEntry.text = `Отказ → штраф по "${card.title}"`;
            } else {
              logEntry.text = `Пропущено "${card.title}"`;
            }
          }
          return {
            ...patch,
            opportunity: null,
            recentLog: [logEntry, ...baseLog].slice(0, 5),
          };
        }),
      applyHomeAction: (actionId) =>
        set((state) => {
          const { patch, message } = handleHomeAction(actionId, state);
          if (!message) {
            return { ...patch };
          }
          const logEntry = {
            id: `${actionId}-${Date.now()}`,
            text: message,
            month: state.month,
          };
          const recentLog = [logEntry, ...(state.recentLog || [])].slice(0, 5);
          return { ...patch, recentLog };
        }),
      resetGame: () =>
        set((state) => ({
          ...buildProfessionState(state, state.profession),
          ...(() => {
            const roll = rollMonthlyActions(state.rngSeed || ensureStoredSeed());
            return { availableActions: roll.actions, rngSeed: roll.seed };
          })(),
        })),
    }),
    {
      name: 'finstrategy-store',
      storage: hydratedStorage,
      partialize: (state) => ({
        configs: state.configs,
        configsReady: state.configsReady,
        rngSeed: state.rngSeed,
        profession: state.profession,
        professionId: state.professionId,
        month: state.month,
        cash: state.cash,
        debt: state.debt,
        baseLivingCost: state.baseLivingCost,
        livingCost: state.livingCost,
        lifestyleModifier: state.lifestyleModifier,
        salaryBonus: state.salaryBonus,
        recurringExpenses: state.recurringExpenses,
        protections: state.protections,
        investments: state.investments,
        priceState: state.priceState,
        shockState: state.shockState,
        history: state.history,
        trackers: state.trackers,
        winCondition: state.winCondition,
        loseCondition: state.loseCondition,
        creditLimit: state.creditLimit,
        availableCredit: state.availableCredit,
        lastTurn: state.lastTurn,
        recentLog: state.recentLog,
        opportunity: state.opportunity,
        availableActions: state.availableActions,
      }),
    },
  ),
);

export const homeActions = HOME_ACTIONS;

export default useGameStore;
