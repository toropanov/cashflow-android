import spriteUrl from '../assets/icons.png';

const SPRITE_WIDTH = 1024;
const SPRITE_HEIGHT = 1536;

const OFFSETS = {
  iconWallet: [-256, -768],
  iconCard: [-768, -256],
  iconOwl: [-768, 0],
  iconCalculator: [-512, -512],
  iconStethoscope: [-256, -512],
  iconSmile: [-512, 0],
  iconGrowth: [0, -256],
  iconHardhat: [0, -1024],
  iconPiggy: [0, -1280],
  iconGift: [-256, -1024],
  iconCoins: [-256, 0],
  iconPlant: [-768, -512],
  iconBulb: [0, -768],
  iconCart: [-768, -1024],
  iconStocks: [0, -256],
  iconBonds: [-256, 0],
  iconCrypto: [-512, -768],
};

export function spriteStyle(key) {
  const [x, y] = OFFSETS[key] || OFFSETS.iconCoins;
  return {
    backgroundImage: `url(${spriteUrl})`,
    backgroundSize: `${SPRITE_WIDTH}px ${SPRITE_HEIGHT}px`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: `${x}px ${y}px`,
  };
}

export function getTypeIcon(type) {
  switch (type) {
    case 'stocks':
      return 'iconStocks';
    case 'bonds':
      return 'iconBonds';
    case 'crypto':
      return 'iconCrypto';
    default:
      return 'iconCoins';
  }
}

const PROFESSION_ICONS = {
  teacher: 'iconOwl',
  programmer: 'iconCalculator',
  lawyer: 'iconCard',
  dentist: 'iconStethoscope',
  firefighter: 'iconHardhat',
  sales_manager: 'iconWallet',
};

export function getProfessionIcon(profession) {
  if (!profession) return 'iconWallet';
  return PROFESSION_ICONS[profession.id] || 'iconPiggy';
}
