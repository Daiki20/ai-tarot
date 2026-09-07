// Витрина платных раскладов. Курировано: 5 героев + один якорный.
// href пока указывает на существующий движок /spread как превью-демо.

export interface Reading {
  id: string;
  title: string;
  question: string; // формулировка от лица пользователя
  example: string; // подсказка в поле ввода вопроса
  blurb: string;
  price: number; // ₽
  cards: number;
  href: string;
  anchor?: boolean; // дорогой якорь, не толкаем
  chat?: boolean; // к раскладу прилагается бесплатный диалог с AI-тарологом
}

export const READINGS: Reading[] = [
  {
    id: "yes-no",
    title: "Да / Нет",
    question: "«Стоит ли мне написать ему первой?»",
    example: "Стоит ли мне написать ему первой?",
    blurb: "Короткий ответ на конкретный вопрос: три карты, вероятность и что может помешать.",
    price: 99,
    cards: 3,
    href: "/spread/three",
  },
  {
    id: "feelings",
    title: "Что он чувствует",
    question: "«Что он на самом деле ко мне чувствует?»",
    example: "Что он на самом деле ко мне чувствует?",
    blurb: "Шесть карт: чувства, мысли, что скрывает, чего хочет и что будет между вами.",
    price: 199,
    cards: 6,
    href: "/spread/relationship",
  },
  {
    id: "return",
    title: "Вернётся ли",
    question: "«Вернётся ли бывший?»",
    example: "Хочет ли он вернуться в наши отношения?",
    blurb: "Помнит ли прошлое, хочет ли вернуться, что мешает и какова вероятность контакта.",
    price: 199,
    cards: 6,
    href: "/spread/relationship",
  },
  {
    id: "relationship-future",
    title: "Будущее отношений",
    question: "«К чему идут наши отношения?»",
    example: "К чему идут наши отношения — к сближению или разрыву?",
    blurb: "Глубокий любовный расклад: скрытые чувства, конфликт, желания партнёра и итог.",
    price: 349,
    cards: 9,
    href: "/spread/relationship",
  },
  {
    id: "month",
    title: "Прогноз на месяц",
    question: "«Что меня ждёт в этом месяце?»",
    example: "Что меня ждёт в этом месяце в любви и деньгах?",
    blurb: "Любовь, деньги, работа, окружение и одно важное событие — по неделям.",
    price: 299,
    cards: 7,
    href: "/spread/celtic",
    chat: true,
  },
  {
    id: "career",
    title: "Карьера и деньги",
    question: "«Стоит ли мне менять работу?»",
    example: "Стоит ли мне сейчас менять работу?",
    blurb: "Текущее положение, ваш потенциал, что мешает, финансовая перспектива и совет.",
    price: 299,
    cards: 7,
    href: "/spread/celtic",
    chat: true,
  },
  {
    id: "full",
    title: "Полный расклад",
    question: "«Я не понимаю, куда двигаться дальше».",
    example: "Я не понимаю, куда двигаться дальше — помогите разобраться.",
    blurb: "Большой разбор ситуации с продолжением в диалоге с AI-тарологом.",
    price: 690,
    cards: 12,
    href: "/spread/celtic",
    anchor: true,
    chat: true,
  },
];

export function getReadingById(id: string): Reading | undefined {
  return READINGS.find((r) => r.id === id);
}
