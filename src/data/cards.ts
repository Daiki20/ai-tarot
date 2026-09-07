export type Suit = "major" | "wands" | "cups" | "swords" | "pentacles";

export interface TarotCard {
  id: string;
  name: string;
  suit: Suit;
  number: number;
  image: string;
  upright: string;
  reversed: string;
  keywords: string[];
}

const suitNames: Record<Exclude<Suit, "major">, string> = {
  wands: "Жезлов",
  cups: "Кубков",
  swords: "Мечей",
  pentacles: "Пентаклей",
};

const minorRanks = [
  "Туз",
  "Двойка",
  "Тройка",
  "Четвёрка",
  "Пятёрка",
  "Шестёрка",
  "Семёрка",
  "Восьмёрка",
  "Девятка",
  "Десятка",
  "Паж",
  "Рыцарь",
  "Королева",
  "Король",
];

const majorArcana: Omit<TarotCard, "image">[] = [
  { id: "a-00", name: "Шут", suit: "major", number: 0, keywords: ["начало", "спонтанность", "риск"], upright: "Новые начинания, спонтанность, вера в путь, невинность и открытость миру.", reversed: "Безрассудство, необдуманный риск, страх перед неизвестным, хаос." },
  { id: "a-01", name: "Маг", suit: "major", number: 1, keywords: ["воля", "мастерство", "действие"], upright: "Сила воли, мастерство, использование всех ресурсов для достижения цели.", reversed: "Манипуляции, нереализованный потенциал, обман, разбросанность сил." },
  { id: "a-02", name: "Верховная Жрица", suit: "major", number: 2, keywords: ["интуиция", "тайна", "подсознание"], upright: "Интуиция, тайное знание, связь с подсознанием, спокойствие и мудрость.", reversed: "Скрытые мотивы, потеря связи с интуицией, поверхностность." },
  { id: "a-03", name: "Императрица", suit: "major", number: 3, keywords: ["изобилие", "забота", "природа"], upright: "Изобилие, плодородие, забота, гармония с природой и творчество.", reversed: "Застой, зависимость, гиперопека, творческий кризис." },
  { id: "a-04", name: "Император", suit: "major", number: 4, keywords: ["власть", "структура", "контроль"], upright: "Стабильность, структура, лидерство, авторитет и рациональный контроль.", reversed: "Тирания, ригидность, злоупотребление властью, потеря контроля." },
  { id: "a-05", name: "Иерофант", suit: "major", number: 5, keywords: ["традиция", "учение", "система"], upright: "Традиции, духовное наставничество, обучение, следование правилам.", reversed: "Бунт против системы, нонконформизм, отказ от догм." },
  { id: "a-06", name: "Влюблённые", suit: "major", number: 6, keywords: ["выбор", "союз", "любовь"], upright: "Любовь, гармония отношений, важный выбор ценностей, союз.", reversed: "Дисбаланс в отношениях, неверный выбор, разлад, искушение." },
  { id: "a-07", name: "Колесница", suit: "major", number: 7, keywords: ["воля", "движение", "победа"], upright: "Решимость, победа через самоконтроль, движение к цели.", reversed: "Потеря направления, отсутствие контроля, агрессия, застой." },
  { id: "a-08", name: "Сила", suit: "major", number: 8, keywords: ["мужество", "терпение", "внутренняя сила"], upright: "Внутренняя сила, мужество, терпение и сострадание побеждают грубую силу.", reversed: "Слабость воли, сомнения в себе, злоупотребление силой." },
  { id: "a-09", name: "Отшельник", suit: "major", number: 9, keywords: ["уединение", "поиск истины", "мудрость"], upright: "Поиск внутренней истины, уединение, самоанализ, наставничество.", reversed: "Изоляция, одиночество, отказ от помощи, потерянность." },
  { id: "a-10", name: "Колесо Фортуны", suit: "major", number: 10, keywords: ["судьба", "перемены", "циклы"], upright: "Перемены судьбы, удача, поворотный момент, цикличность жизни.", reversed: "Полоса неудач, сопротивление переменам, сбой цикла." },
  { id: "a-11", name: "Справедливость", suit: "major", number: 11, keywords: ["баланс", "истина", "закон"], upright: "Справедливость, истина, причинно-следственная связь, честность.", reversed: "Несправедливость, предвзятость, уклонение от ответственности." },
  { id: "a-12", name: "Повешенный", suit: "major", number: 12, keywords: ["жертва", "пауза", "новый взгляд"], upright: "Смена перспективы, добровольная жертва, пауза для переосмысления.", reversed: "Промедление, сопротивление необходимому, ощущение жертвы напрасно." },
  { id: "a-13", name: "Смерть", suit: "major", number: 13, keywords: ["трансформация", "конец", "перерождение"], upright: "Окончание одного этапа и начало другого, трансформация, освобождение.", reversed: "Страх перемен, застревание в прошлом, сопротивление неизбежному." },
  { id: "a-14", name: "Умеренность", suit: "major", number: 14, keywords: ["баланс", "гармония", "терпение"], upright: "Гармония, умеренность, поиск баланса, терпеливое соединение крайностей.", reversed: "Дисбаланс, крайности, нетерпение, внутренний разлад." },
  { id: "a-15", name: "Дьявол", suit: "major", number: 15, keywords: ["зависимость", "искушение", "тень"], upright: "Зависимость, привязанность к материальному, искушение, теневые стороны.", reversed: "Освобождение от оков, осознание зависимости, восстановление контроля." },
  { id: "a-16", name: "Башня", suit: "major", number: 16, keywords: ["разрушение", "откровение", "кризис"], upright: "Внезапные перемены, крушение иллюзий, освобождающий кризис.", reversed: "Отложенная катастрофа, страх перемен, избегание неизбежного." },
  { id: "a-17", name: "Звезда", suit: "major", number: 17, keywords: ["надежда", "вдохновение", "исцеление"], upright: "Надежда, вдохновение, исцеление, вера в будущее.", reversed: "Отчаяние, потеря веры, разочарование, истощение." },
  { id: "a-18", name: "Луна", suit: "major", number: 18, keywords: ["иллюзии", "страхи", "подсознание"], upright: "Иллюзии, тревоги, работа с подсознанием и интуицией, неопределённость.", reversed: "Освобождение от страхов, прояснение ситуации, конец обмана." },
  { id: "a-19", name: "Солнце", suit: "major", number: 19, keywords: ["радость", "успех", "ясность"], upright: "Радость, успех, жизненная энергия, ясность и оптимизм.", reversed: "Временное затмение радости, завышенные ожидания, задержка успеха." },
  { id: "a-20", name: "Суд", suit: "major", number: 20, keywords: ["пробуждение", "обновление", "призвание"], upright: "Пробуждение, переоценка прошлого, ответ на призвание, обновление.", reversed: "Самокритика, страх перемен, отказ услышать зов." },
  { id: "a-21", name: "Мир", suit: "major", number: 21, keywords: ["завершение", "целостность", "успех"], upright: "Завершение цикла, целостность, достижение цели, гармония.", reversed: "Незавершённость, отсутствие финала, поиск последнего шага." },
];

function buildMinorSuit(suit: Exclude<Suit, "major">, prefix: string): Omit<TarotCard, "image">[] {
  return minorRanks.map((rank, i) => {
    const num = i + 1;
    const name = `${rank} ${suitNames[suit]}`;
    return {
      id: `${prefix}-${String(num).padStart(2, "0")}`,
      name,
      suit,
      number: num,
      keywords: minorKeywords(suit, num),
      upright: minorUpright(suit, num),
      reversed: minorReversed(suit, num),
    };
  });
}

function suitTheme(suit: Exclude<Suit, "major">) {
  switch (suit) {
    case "wands":
      return { theme: "энергии, творчества и амбиций", element: "Огонь" };
    case "cups":
      return { theme: "чувств, отношений и интуиции", element: "Вода" };
    case "swords":
      return { theme: "разума, конфликтов и истины", element: "Воздух" };
    case "pentacles":
      return { theme: "материального мира, денег и труда", element: "Земля" };
  }
}

const rankMeaning: Record<number, { upright: string; reversed: string }> = {
  1: { upright: "новое начало, чистый потенциал", reversed: "упущенная возможность, задержка старта" },
  2: { upright: "выбор, планирование, партнёрство", reversed: "нерешительность, дисбаланс планов" },
  3: { upright: "рост, первые результаты, сотрудничество", reversed: "задержка роста, разобщённость" },
  4: { upright: "стабильность, отдых, фундамент", reversed: "нестабильность, застой, отсутствие опоры" },
  5: { upright: "конфликт, соперничество, испытание", reversed: "истощение конфликта, поиск компромисса" },
  6: { upright: "победа, признание, гармония", reversed: "отложенный успех, зависть, дисбаланс" },
  7: { upright: "настойчивость, защита позиций", reversed: "истощение, отказ от борьбы" },
  8: { upright: "быстрое движение, перемены, действие", reversed: "задержки, хаотичность, застревание" },
  9: { upright: "почти достигнутая цель, стойкость", reversed: "тревога, истощение перед финишем" },
  10: { upright: "завершение цикла, тяжесть ноши", reversed: "освобождение от груза, завершение через кризис" },
  11: { upright: "ученичество, любопытство, новые вести", reversed: "незрелость, невнимательность, задержка вестей" },
  12: { upright: "движение, стремительные действия", reversed: "импульсивность, разбросанность, отступление" },
  13: { upright: "зрелость, чуткость, мастерство внутри стихии", reversed: "чрезмерная требовательность или замкнутость" },
  14: { upright: "авторитет, мастерство, зрелое управление стихией", reversed: "деспотизм или слабость власти" },
};

function minorKeywords(suit: Exclude<Suit, "major">, num: number): string[] {
  const { theme } = suitTheme(suit);
  return [theme.split(",")[0], rankMeaning[num].upright.split(",")[0]];
}

function minorUpright(suit: Exclude<Suit, "major">, num: number): string {
  const { theme } = suitTheme(suit);
  return `В контексте ${theme}: ${rankMeaning[num].upright}.`;
}

function minorReversed(suit: Exclude<Suit, "major">, num: number): string {
  const { theme } = suitTheme(suit);
  return `В контексте ${theme}: ${rankMeaning[num].reversed}.`;
}

const wands = buildMinorSuit("wands", "w");
const cups = buildMinorSuit("cups", "c");
const swords = buildMinorSuit("swords", "s");
const pentacles = buildMinorSuit("pentacles", "p");

const allCardsBase = [...majorArcana, ...wands, ...cups, ...swords, ...pentacles];

export const CARDS: TarotCard[] = allCardsBase.map((c) => ({
  ...c,
  image: `/cards/${c.id}.svg`,
}));

export function getCardById(id: string): TarotCard | undefined {
  return CARDS.find((c) => c.id === id);
}
