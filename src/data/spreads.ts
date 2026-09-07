export interface SpreadPosition {
  label: string;
  hint: string;
  x: number; // percent, left
  y: number; // percent, top
  rotate?: number;
  labelSide?: "top" | "bottom" | "left" | "right"; // где рисовать подпись; по умолчанию снизу
}

export interface Spread {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  positions: SpreadPosition[];
  containerAspect: string;
  askQuestion?: boolean; // показывать шаг «сформулируйте вопрос» перед раскладом
  questionExample?: string; // подсказка в поле ввода, если расклад открыт без конкретного продукта
  chat?: boolean; // после разбора открывать диалог с AI-тарологом
}

export const SPREADS: Spread[] = [
  {
    id: "day",
    name: "Карта дня",
    description: "Одна карта, которая задаёт тон и подсказку на сегодняшний день.",
    cardCount: 1,
    positions: [{ label: "Карта дня", hint: "Главная энергия дня", x: 50, y: 50 }],
    containerAspect: "16/5",
  },
  {
    id: "three",
    name: "Прошлое · Настоящее · Будущее",
    description: "Классический расклад из трёх карт, показывающий течение ситуации во времени.",
    cardCount: 3,
    positions: [
      { label: "Прошлое", hint: "Что привело к текущей ситуации", x: 20, y: 50 },
      { label: "Настоящее", hint: "Суть ситуации сейчас", x: 50, y: 50 },
      { label: "Будущее", hint: "Куда всё движется", x: 80, y: 50 },
    ],
    containerAspect: "16/5",
    askQuestion: true,
    questionExample: "Как будет развиваться моя ситуация?",
  },
  {
    id: "relationship",
    name: "Отношения",
    description: "Пятикарточный расклад для анализа отношений между вами и партнёром.",
    cardCount: 5,
    positions: [
      { label: "Вызов", hint: "Главное испытание отношений", x: 50, y: 17, labelSide: "top" },
      { label: "Вы", hint: "Ваше состояние в отношениях", x: 26, y: 52 },
      { label: "Связь", hint: "Что соединяет вас сейчас", x: 50, y: 52 },
      { label: "Партнёр", hint: "Состояние партнёра", x: 74, y: 52 },
      { label: "Потенциал", hint: "К чему всё идёт", x: 50, y: 83 },
    ],
    containerAspect: "16/9",
    askQuestion: true,
    questionExample: "Что сейчас происходит между мной и партнёром?",
  },
  {
    id: "celtic",
    name: "Кельтский крест",
    description: "Глубокий десятикарточный расклад для детального анализа ситуации.",
    cardCount: 10,
    positions: [
      { label: "Ситуация", hint: "Суть текущего положения", x: 36, y: 52 },
      { label: "Вызов", hint: "Что пересекает ситуацию", x: 36, y: 52, rotate: 90, labelSide: "top" },
      { label: "Основа", hint: "Корень и фундамент вопроса", x: 36, y: 80 },
      { label: "Прошлое", hint: "Уходящее влияние", x: 19, y: 52 },
      { label: "Возможное", hint: "Потенциал, венчающий ситуацию", x: 36, y: 22, labelSide: "top" },
      { label: "Будущее", hint: "Ближайшее будущее", x: 53, y: 52 },
      { label: "Вы", hint: "Ваша позиция и отношение", x: 72, y: 88, labelSide: "right" },
      { label: "Окружение", hint: "Влияние близких и среды", x: 72, y: 64, labelSide: "right" },
      { label: "Надежды и страхи", hint: "Внутренние ожидания", x: 72, y: 40, labelSide: "right" },
      { label: "Итог", hint: "Итоговый результат ситуации", x: 72, y: 16, labelSide: "right" },
    ],
    containerAspect: "16/10",
    askQuestion: true,
    questionExample: "Что мне важно понять про свою ситуацию сейчас?",
    chat: true,
  },
];

export function getSpreadById(id: string): Spread | undefined {
  return SPREADS.find((s) => s.id === id);
}
