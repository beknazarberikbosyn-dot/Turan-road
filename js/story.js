// Сценарий: внешность персонажей, постановка сцен и сюжетные задания.
// Тексты фактов, путешествий во времени и испытаний лежат в data.js,
// здесь — то, как они разыгрываются в анимированных сценах.

const SKIN = { light: '#E8B48C', mid: '#E3B288', warm: '#D9A27A', tan: '#C98E66', deep: '#B87B55' };

// ── герой ──────────────────────────────────────────────
export function heroRig(h = {}) {
  const girl = h.look ? h.look === 'f' : h.type === 'sayahat';
  const base = { age: 'teen', sex: girl ? 'f' : 'm', skin: SKIN.mid, hair: '#24150D', eyes: '#4A2E18', hairStyle: girl ? 'braids' : 'short' };
  if (h.type === 'sayahat') {
    return { ...base, hat: { type: 'borik', color: '#B8382C', trim: '#E7A93B', fur: '#6B4A2E', uki: true }, outfit: { type: 'chapan', color: '#B8382C', trim: '#E7A93B', inner: '#F4EFE4', pants: '#3A2A20', boots: '#4A2A16' }, back: 'dombra', chest: 'bag' };
  }
  return { ...base, hat: { type: 'helmet' }, outfit: { type: 'armor', color: '#3A5BA6', trim: '#E7A93B', inner: '#F4EFE4', pants: '#2E2A3A', boots: '#2B1A12' }, back: 'shield', chest: 'sword' };
}

// ── жители ─────────────────────────────────────────────
export const RIGS = {
  sapar: { age: 'elder', sex: 'm', skin: SKIN.warm, hair: '#E8E4DC', beard: 'long', beardColor: '#F2F0EA', hat: { type: 'kalpak', color: '#F2EBDD', trim: '#1A1A1A' }, outfit: { type: 'chapan', color: '#2F5E46', trim: '#E7A93B', inner: '#F4EFE4', pants: '#2B2B2B' }, hold: 'staff', pose: 'staff', mood: 'kind' },
  nurlan: { age: 'adult', sex: 'm', skin: SKIN.warm, hair: '#1E120C', beard: 'moustache', hat: { type: 'kalpak', color: '#F2EBDD', trim: '#1A1A1A' }, outfit: { type: 'apron', color: '#3F5FA8', trim: '#E7A93B', inner: '#F4EFE4', apron: '#9C7A54', pants: '#3A2A20' }, hold: 'tile', pose: 'hold' },
  aigerim: { age: 'adult', sex: 'f', skin: SKIN.light, hair: '#3A2418', hairStyle: 'pony', hat: { type: 'panama', color: '#D8C9A0', trim: '#6B4A2E' }, outfit: { type: 'vest', color: '#9C8A5E', inner: '#F2EEE4', pants: '#6E6450', boots: '#5A3A1C' }, hold: 'brush' },
  aizhan: { age: 'adult', sex: 'f', skin: SKIN.mid, hair: '#24150D', hat: { type: 'scarf', color: '#B8382C', trim: '#F4E3C1' }, outfit: { type: 'dress', color: '#7A1E2C', trim: '#E7A93B', inner: '#F7F2E6', skirt: '#F2E8D4' }, mood: 'kind' },
  erbol: { age: 'adult', sex: 'm', skin: SKIN.tan, hair: '#1E120C', beard: 'short', hat: { type: 'borik', color: '#3A2A20', trim: '#E7A93B', fur: '#7A5A3A' }, outfit: { type: 'chapan', color: '#7A5A3A', trim: '#C9A06A', inner: '#F2EEE4', pants: '#3A2A20' }, hold: 'crook', pose: 'staff' },
  nurbol: { age: 'child', sex: 'm', skin: SKIN.mid, hair: '#24150D', hat: { type: 'takiya', color: '#1C6E8C', trim: '#F4E3C1' }, outfit: { type: 'shirt', color: '#3F5FA8', inner: '#F2EEE4', pants: '#3A3A5A', boots: '#3A2418' }, mood: 'happy' },
  madina: { age: 'adult', sex: 'f', skin: SKIN.light, hair: '#24150D', glasses: true, hat: { type: 'scarf', color: '#2E6A9A', trim: '#F4E3C1' }, outfit: { type: 'jacket', color: '#F2F0EA', trim: '#9AA3AD', inner: '#C9D8E6', pants: '#3A3A4A', boots: '#2B2B2B' }, hold: 'magnifier' },
  serik: { age: 'adult', sex: 'm', skin: SKIN.tan, hair: '#1E120C', beard: 'moustache', hat: { type: 'cap', color: '#4E6E3A', trim: '#E7A93B' }, outfit: { type: 'uniform', color: '#5E7E46', trim: '#E7A93B', inner: '#D8DCC8', pants: '#4A5A3A', boots: '#3A2A20', badge: '#E7A93B' }, chest: 'whistle' },
  touristDad: { age: 'adult', sex: 'm', skin: SKIN.light, hair: '#5A3A22', hat: { type: 'cap', color: '#C0504A', trim: '#F4E3C1' }, outfit: { type: 'shirt', color: '#2E9AA8', inner: '#2E9AA8', pants: '#3A4A6A', boots: '#3A3A3A' }, chest: 'camera' },
  touristGirl: { age: 'child', sex: 'f', skin: SKIN.light, hair: '#5A3A22', hairStyle: 'pony', outfit: { type: 'jacket', color: '#F2C14E', inner: '#F2EEE4', pants: '#3F5FA8', boots: '#C0504A' }, mood: 'happy' },
  dana: { age: 'adult', sex: 'f', skin: SKIN.mid, hair: '#24150D', hairStyle: 'pony', hat: { type: 'cap', color: '#9C8A5E', trim: '#3F5FA8' }, outfit: { type: 'vest', color: '#7E6E46', inner: '#E8E2D0', pants: '#5E5440', boots: '#4A3420' }, chest: 'binoculars' },
  kairat: { age: 'elder', sex: 'm', skin: SKIN.tan, hair: '#C9C4B8', beard: 'short', beardColor: '#D8D4CC', hat: { type: 'fishcap', color: '#3A4A5E' }, outfit: { type: 'vest', color: '#4E5E46', inner: '#D8D2C4', pants: '#3A3A44', boots: '#2B2B2B' }, hold: 'net', mood: 'kind' },
  ayaru: { age: 'child', sex: 'f', skin: SKIN.mid, hair: '#24150D', hairStyle: 'braids', outfit: { type: 'dress', color: '#2E9AA8', trim: '#E7A93B', inner: '#F7F2E6', skirt: '#F2E8D4' }, mood: 'happy' },
  bakyt: { age: 'adult', sex: 'm', skin: SKIN.tan, hair: '#1E120C', beard: 'short', hat: { type: 'tymak', color: '#7A1E2C', trim: '#E7A93B', fur: '#8C6A42' }, outfit: { type: 'fur', color: '#6B4A2E', trim: '#C9A06A', inner: '#E8E2D0', fur: '#C9B08A', pants: '#3A2A20' }, back: 'lasso' },
  akbope: { age: 'elder', sex: 'f', skin: SKIN.warm, hat: { type: 'kimeshek' }, outfit: { type: 'dress', color: '#4A3A6A', trim: '#E7A93B', inner: '#F4EFE4', skirt: '#3A2A50' }, chest: 'bib', hold: 'staff', pose: 'staff', mood: 'kind' },
  erlan: { age: 'child', sex: 'm', skin: SKIN.mid, hair: '#24150D', outfit: { type: 'chapan', color: '#2E6A9A', trim: '#E7A93B', inner: '#F4EFE4', pants: '#3A3A5A' }, hat: { type: 'takiya', color: '#7A1E2C', trim: '#F4E3C1' }, mood: 'happy' },
  erzhan: { age: 'adult', sex: 'm', skin: SKIN.tan, hair: '#1E120C', beard: 'moustache', hat: { type: 'borik', color: '#4A2A6A', trim: '#E7A93B', fur: '#5A3A22' }, outfit: { type: 'chapan', color: '#5E3A7A', trim: '#E7A93B', inner: '#F4EFE4', pants: '#2B2B2B' }, chest: 'dombra', pose: 'play' },
  tolegen: { age: 'elder', sex: 'm', skin: SKIN.deep, hair: '#E8E4DC', beard: 'long', beardColor: '#EDEAE2', hat: { type: 'fishcap', color: '#2B3A4E', badge: '#E7A93B' }, outfit: { type: 'jacket', color: '#2B3A4E', trim: '#E7A93B', inner: '#E8E2D0', pants: '#2B2B33', boots: '#1E1E1E' }, hold: 'cane', pose: 'staff' },
  alia: { age: 'adult', sex: 'f', skin: SKIN.light, hair: '#3A2418', hairStyle: 'pony', hat: { type: 'hardhat', color: '#E8742E' }, outfit: { type: 'jacket', color: '#C0504A', trim: '#E7A93B', inner: '#E8E2D0', pants: '#4A4A5A', boots: '#3A2A20' }, hold: 'hammer' },
  // люди прошлого
  founder: { age: 'adult', sex: 'm', skin: SKIN.tan, hair: '#1E120C', beard: 'short', hat: { type: 'turban', color: '#F2EEE4' }, outfit: { type: 'apron', color: '#8C5A2B', trim: '#C9A06A', inner: '#E8DCC0', apron: '#5A3A22', pants: '#3A2A20' } },
  merchant: { age: 'adult', sex: 'm', skin: SKIN.warm, hair: '#1E120C', beard: 'short', hat: { type: 'turban', color: '#2E9AA8', gem: '#E7A93B' }, outfit: { type: 'chapan', color: '#A8322A', trim: '#E7A93B', inner: '#F4EFE4', pants: '#3A2A20' } },
  papermaker: { age: 'adult', sex: 'm', skin: SKIN.light, hair: '#1E120C', hairStyle: 'bun', outfit: { type: 'tunic', color: '#4E6E8A', trim: '#C9B88A', inner: '#E8E2D0', pants: '#2B2B33', boots: '#3A3A3A' } },
  bronzeElder: { age: 'elder', sex: 'm', skin: SKIN.tan, hair: '#C9C4B8', hairStyle: 'long', beard: 'long', beardColor: '#D8D4CC', outfit: { type: 'fur', color: '#8C6A42', trim: '#C9A06A', inner: '#C9B08A', fur: '#B89A6C', pants: '#5A3A22', boots: '#3A2418' }, hold: 'staff', pose: 'staff' },
  sakaSmith: { age: 'adult', sex: 'm', skin: SKIN.tan, hair: '#1E120C', beard: 'short', hat: { type: 'saka', color: '#B8382C' }, outfit: { type: 'tunic', color: '#A8322A', trim: '#E7A93B', inner: '#E8DCC0', pants: '#3A2A20' } },
  zoologist: { age: 'adult', sex: 'm', skin: SKIN.light, hair: '#5A3A22', beard: 'moustache', hat: { type: 'fishcap', color: '#6E6450' }, outfit: { type: 'vest', color: '#7E7454', inner: '#E8E2D0', pants: '#5E5440', boots: '#3A2A20' } },
  hunter: { age: 'elder', sex: 'm', skin: SKIN.tan, hair: '#9C958A', beard: 'short', beardColor: '#B8B2A8', hat: { type: 'tymak', color: '#3A2A20', trim: '#C9A06A', fur: '#7A5A3A' }, outfit: { type: 'fur', color: '#5A4A3A', trim: '#9C7A54', inner: '#D8CCB0', fur: '#A8906A', pants: '#3A2A20' }, back: 'quiver' },
  pazyryk: { age: 'elder', sex: 'm', skin: SKIN.warm, hair: '#C9C4B8', beard: 'long', beardColor: '#D8D4CC', hat: { type: 'tall', color: '#3A2A20', trim: '#E7A93B' }, outfit: { type: 'fur', color: '#7A2A20', trim: '#E7A93B', inner: '#E8DCC0', fur: '#C9B08A', pants: '#3A2A20' } },
  batyr: { age: 'adult', sex: 'm', skin: SKIN.tan, hair: '#1E120C', beard: 'moustache', hat: { type: 'helmet' }, outfit: { type: 'armor', color: '#7A1E2C', trim: '#E7A93B', inner: '#F4EFE4', pants: '#2B2B2B' }, back: 'shield', chest: 'sword' },
  ketbuga: { age: 'elder', sex: 'm', skin: SKIN.tan, hair: '#C9C4B8', beard: 'long', beardColor: '#D8D4CC', hat: { type: 'borik', color: '#2E4A6A', trim: '#E7A93B', fur: '#5A3A22' }, outfit: { type: 'chapan', color: '#3A4A6A', trim: '#E7A93B', inner: '#F4EFE4', pants: '#2B2B2B' }, chest: 'dombra', pose: 'play' },
  brigadier: { age: 'adult', sex: 'm', skin: SKIN.tan, hair: '#1E120C', beard: 'moustache', hat: { type: 'fishcap', color: '#2B3A4E' }, outfit: { type: 'jacket', color: '#3A4A5E', trim: '#9AA3AD', inner: '#F2EEE4', pants: '#2B2B33', boots: '#1E1E1E' }, mood: 'kind' },
};

// ── постановка мест ────────────────────────────────────
// facts: точка на картинке для каждого факта (в том же порядке, что в data.js)
// quest: сюжетные задания; game — экшен-испытание из data.js
export const STORY = {
  turkestan: {
    npc: 'nurlan', pitch: 135,
    facts: ['dome', 'portal', 'kazan', 'tombs', 'pilgrims'],
    explore: 'Осмотрись: нажимай на то, что тебе интересно, — я всё расскажу.',
    quest: [
      {
        type: 'proofread', title: 'Табличка экскурсовода', doc: 'sign',
        intro: 'Беда! Новый экскурсовод повесил табличку для туристов, а в ней ошибки. Группа придёт через час. Найди и исправь их — нажимай на подозрительные слова.',
        parts: [
          'Мавзолей Ходжи Ахмеда Ясави начали строить по приказу ',
          { t: 'Чингисхана', opts: ['Чингисхана', 'Тимура', 'Абылай хана'], ok: 'Тимура', why: 'Мавзолей заложил Тимур. Чингисхан жил на полтора века раньше.' },
          ' в конце ', { t: 'XII века', opts: ['XII века', 'XIV века', 'XVIII века'], ok: 'XIV века', why: 'Строить начали в конце XIV века — Тайказан отлили в 1399 году.' },
          '. После смерти Тимура в ', { t: '1405', opts: ['1305', '1405', '1505'], ok: '1405' },
          ' году работы остановились, поэтому главный портал ', { t: 'так и не достроили', opts: ['так и не достроили', 'разобрали по кирпичику', 'покрыли золотом'], ok: 'так и не достроили' },
          '. Внутри стоит Тайказан — котёл весом около ', { t: 'двадцати тонн', opts: ['двухсот килограммов', 'двух тонн', 'двадцати тонн'], ok: 'двух тонн', why: 'Тайказан весит около двух тонн при диаметре почти 2,5 метра.' },
          '. В XVI–XVIII веках Туркестан был столицей ', { t: 'Золотой Орды', opts: ['Золотой Орды', 'Казахского ханства', 'Римской империи'], ok: 'Казахского ханства', why: 'Туркестан был столицей Казахского ханства — здесь похоронены многие ханы.' },
          ', а мавзолей входит в список ЮНЕСКО с ', { t: '2003', opts: ['1993', '2003', '2013'], ok: '2003' }, ' года.',
        ],
        done: 'Рахмет! Теперь табличка не стыдно показать туристам. Ты разбираешься в истории не хуже экскурсовода.',
      },
      { type: 'game', win: 'Купол снова сияет бирюзой! Ты вернул изразцы на место — как настоящий мастер.', lose: 'Ничего, изразцы подождут. Главное, что ты старался.' },
    ],
    time: { who: 'founder', hello: 'Эй, путник! Осторожно, тут летят искры. Ты пришёл помогать мастерам?', name: 'Мастер', role: 'строитель 1399 года', at: ['foundry', 'scaffold'] },
  },

  otrar: {
    npc: 'aigerim', pitch: 215,
    facts: ['walls', 'layer', 'farabi', 'arystan', 'scroll'],
    explore: 'Здесь каждый холм — страница истории. Нажимай на места, которые хочешь рассмотреть.',
    quest: [
      { type: 'game', win: 'Все пять находок! У тебя глаз настоящего археолога.', lose: 'Ветер засыпал раскоп, но кое-что мы всё-таки нашли.' },
      {
        type: 'arrange', mode: 'bins', title: 'Слои раскопа',
        intro: 'А теперь главное. Находку мало найти — нужно понять, из какого она времени. Чем глубже слой, тем он древнее, а чёрный слой пепла остался от пожара 1219–1220 годов. Разложи находки по слоям.',
        slots: [
          { id: 'top', label: 'Верхний слой', hint: 'город отстраивали заново, XIV–XV века' },
          { id: 'ash', label: 'Чёрный слой пепла', hint: 'монгольская осада и пожар, 1219–1220 годы' },
          { id: 'low', label: 'Нижний слой', hint: 'расцвет Отрара, IX–XII века' },
        ],
        cards: [
          { id: 'c1', icon: 'beam', t: 'Обгоревшая балка и наконечник монгольской стрелы', ok: 'ash' },
          { id: 'c2', icon: 'coin', t: 'Монета Караханидов — лежала глубоко под слоем пепла', ok: 'low' },
          { id: 'c3', icon: 'shard', t: 'Черепок чаши с бирюзовой глазурью, как на куполах эпохи Тимура', ok: 'top' },
          { id: 'c4', icon: 'lamp', t: 'Масляный светильник из-под фундамента сгоревшего дома', ok: 'low' },
          { id: 'c5', icon: 'jug', t: 'Кувшин, стоявший прямо на пепле: его принесли, когда город начали отстраивать', ok: 'top' },
        ],
        hint: 'Смотри на подсказки в описании: «под пеплом» — значит раньше пожара, «на пепле» — позже.',
        done: 'Вот это работа археолога! Видно, как город расцвёл, пережил осаду и снова ожил. Кстати, в 1405 году в Отраре умер Тимур.',
      },
    ],
    time: { who: 'merchant', hello: 'Ассалаумағалейкум! Ты тоже с караваном? Отрар — богатый город, здесь торгуют все.', name: 'Караванщик', role: 'купец 1218 года', at: ['@era', 'walls'] },
  },

  taraz: {
    npc: 'aizhan', pitch: 230,
    facts: ['caravan', 'river', 'mausoleum', 'terracotta', 'saukele'],
    explore: 'Наш город — сундук с сокровищами. Нажимай на то, что хочешь рассмотреть.',
    quest: [
      {
        type: 'arrange', mode: 'order', title: 'Бумага для приглашений',
        intro: 'Завтра свадьба моей племянницы! Приглашения хочу написать на бумаге, сделанной по-старинному — как здесь, у Таласа, научились больше тысячи лет назад. Расставь шаги по порядку.',
        slots: [{ id: 0, label: 'Шаг 1' }, { id: 1, label: 'Шаг 2' }, { id: 2, label: 'Шаг 3' }, { id: 3, label: 'Шаг 4' }, { id: 4, label: 'Шаг 5' }],
        cards: [
          { id: 'p1', icon: 'soak', t: 'Замочить в воде тряпьё и кору тутового дерева', ok: 0 },
          { id: 'p2', icon: 'pound', t: 'Растолочь размокшие волокна в кашицу', ok: 1 },
          { id: 'p3', icon: 'sieve', t: 'Зачерпнуть кашицу ситом тонким ровным слоем', ok: 2 },
          { id: 'p4', icon: 'dry', t: 'Высушить лист на солнце', ok: 3 },
          { id: 'p5', icon: 'polish', t: 'Отполировать лист гладким камнем, чтобы чернила не растекались', ok: 4 },
        ],
        hint: 'Подумай, как из мокрых волокон получается лист: сначала размягчить, потом растолочь, разложить, высушить — и только потом полировать.',
        done: 'Бумага получилась! Ой… смотри — караван с шёлком для свадебного платья уже уходит, а с верблюдов упали тюки!',
      },
      { type: 'game', win: 'Шёлк спасён! Невеста будет самой красивой в Таразе.', lose: 'Часть шёлка мы всё-таки собрали. На платье хватит!' },
    ],
    time: { who: 'papermaker', hello: 'Не бойся. Я мастер из далёкой страны. Хочешь узнать, чем я занят?', name: 'Мастер бумаги', role: 'пленный мастер, 751 год', at: ['@era', 'fire'], scene: { kind: 'camp', tone: 'past', tents: true, banner: true } },
  },

  tamgaly: {
    npc: 'erbol', pitch: 120,
    extras: [{ id: 'kid', rig: 'nurbol', name: 'Нұрбол', role: 'внук Ербола', pitch: 330, x: 905, color: '#1C6E8C' }],
    facts: ['panel', 'sun', 'tamga', 'animals'],
    explore: 'Тише… Здесь камни говорят. Нажимай на рисунки — я расскажу, что знаю.',
    quest: [
      {
        type: 'talk', title: 'Вопросы Нұрбола',
        intro: { who: 'npc', text: 'Мой внук Нұрбол засыпал меня вопросами, а я уже не всё помню. Поможешь ему ответить?' },
        steps: [
          { who: 'kid', say: 'Ата, а почему у этих человечков солнце вместо головы?', choices: [
            { t: 'Так древние люди, наверное, изображали богов солнца и света', ok: true, react: { who: 'kid', text: 'Ого! Значит, они верили, что солнце даёт жизнь стадам и травам!', emo: 'happy' } },
            { t: 'Это космонавты в шлемах', react: { who: 'kid', text: 'Ха-ха! Три тысячи лет назад космонавтов не было!', emo: 'laugh' }, hint: 'Солнцеголовые — главная загадка Тамгалы. Учёные думают, что так изображали богов света.' },
            { t: 'Художник просто не умел рисовать головы', react: { who: 'npc', text: 'Ну нет! Посмотри, как точно выбиты быки и лошади — художник был мастером.', emo: 'thinking' } },
          ] },
          { who: 'kid', say: 'А что значит «Тамғалы»?', choices: [
            { t: '«Место со знаками»: тамга — это знак, метка', ok: true, react: { who: 'kid', text: 'Значит, у нашего рода тоже есть тамга? Как подпись!', emo: 'happy' } },
            { t: '«Каменная река»', react: { who: 'npc', text: 'Красиво, но нет. Вспомни, как называются знаки рода.', emo: 'thinking' }, hint: 'Тамга по-казахски — знак, метка.' },
            { t: '«Солнечная гора»', react: { who: 'kid', text: 'А разве тут гора называется? По-моему, речь про знаки…', emo: 'confused' } },
          ] },
          { who: 'kid', say: 'Сколько лет этим рисункам? Сто?', choices: [
            { t: 'Больше трёх тысяч: самые древние выбиты в бронзовом веке', ok: true, react: { who: 'kid', text: 'Три тысячи лет! Это даже больше, чем живут черепахи!', emo: 'surprised' } },
            { t: 'Ровно сто лет', react: { who: 'npc', text: 'Ха! Тогда я бы помнил художника. Нет, они куда старше.', emo: 'laugh' } },
            { t: 'Миллион лет', react: { who: 'npc', text: 'Миллион лет назад людей со стадами здесь ещё не было.', emo: 'thinking' }, hint: 'Самые древние петроглифы Тамгалы — бронзового века, больше трёх тысяч лет назад.' },
          ] },
          { who: 'kid', say: 'Можно я нацарапаю своё имя рядом с солнцеголовым?', choices: [
            { t: 'Нет! Петроглифы охраняет ЮНЕСКО, их нельзя портить. Давай лучше выбьем свой рисунок на отдельном камне', ok: true, react: { who: 'npc', text: 'Вот это правильный ответ. Пойдём, покажу камень для учёбы — на нём можно.', emo: 'proud' } },
            { t: 'Конечно, места тут много', react: { who: 'npc', text: 'Ой-бай, нельзя! Этим рисункам три тысячи лет — их берегут всем миром.', emo: 'angry' }, hint: 'Тамгалы — объект Всемирного наследия ЮНЕСКО. Портить петроглифы нельзя.' },
          ] },
        ],
      },
      { type: 'game', win: 'Твой солнцеголовый — как настоящий! Нұрбол теперь тоже хочет стать мастером.', lose: 'Камень твёрдый, но ты почти справился.' },
    ],
    time: { who: 'bronzeElder', hello: 'Тише, дитя. Мы говорим с камнями. Подойди, посмотри.', name: 'Старейшина', role: 'бронзовый век', at: ['sun', 'animals'], scene: { kind: 'petroglyph', variant: 'past' } },
  },

  esik: {
    npc: 'madina', pitch: 220,
    facts: ['kurgan', 'saka', 'statue', 'lake', 'tulpar'],
    explore: 'Курганы хранят тайны саков. Нажимай на то, что тебе интересно.',
    quest: [
      { type: 'game', win: 'Золотой человек снова в полном наряде! Его можно ставить в музей.', lose: 'Не всё на месте, но я доделаю. Спасибо!' },
      {
        type: 'proofread', title: 'Этикетка для музея', doc: 'label',
        intro: 'Практикант написал этикетку к копии костюма — и наделал ошибок. Найди их до открытия выставки!',
        parts: [
          'Иссыкский курган раскопали в ', { t: '1999', opts: ['1869', '1969', '1999'], ok: '1969', why: 'Раскопки шли в 1969–1970 годах.' },
          ' году. Руководил раскопками археолог ', { t: 'Чокан Валиханов', opts: ['Чокан Валиханов', 'Кемаль Акишев', 'аль-Фараби'], ok: 'Кемаль Акишев', why: 'Курган раскопал Кемаль Акишев. Чокан Валиханов жил в XIX веке.' },
          '. «Золотой человек» жил около ', { t: '2 400', opts: ['240', '2 400', '24 000'], ok: '2 400' },
          ' лет назад и был ', { t: 'гунном', opts: ['гунном', 'саком', 'викингом'], ok: 'саком', why: 'Золотой человек — сакский воин.' },
          '. На его одежде нашли около ', { t: 'четырёхсот', opts: ['сорока', 'четырёхсот', 'четырёх тысяч'], ok: 'четырёх тысяч', why: 'Золотых украшений было около четырёх тысяч.' },
          ' золотых украшений, а на высоком головном уборе — стрелы, ', { t: 'горных козлов', opts: ['горных козлов', 'пингвинов', 'верблюдов'], ok: 'горных козлов' }, ' и крылатых коней.',
        ],
        done: 'Идеальная этикетка! Завтра её прочитают сотни посетителей.',
      },
    ],
    time: { who: 'sakaSmith', hello: 'Подходи ближе, к огню. Видишь, как плавится золото?', name: 'Мастер-ювелир', role: 'сак, 2400 лет назад', at: ['@era', '@horse:head'], horse: { coat: 'kula', x: 905 }, scene: { kind: 'kurgan', variant: 'past', tone: 'saka' } },
  },

  charyn: {
    npc: 'serik', pitch: 125,
    extras: [
      { id: 'dad', rig: 'touristDad', name: 'Турист', role: 'папа', pitch: 150, x: 885, color: '#2E9AA8' },
      { id: 'girl', rig: 'touristGirl', name: 'Майя', role: 'туристка', pitch: 320, x: 800, color: '#E8742E' },
    ],
    facts: ['depth', 'castles', 'grove', 'animals'],
    explore: 'Добро пожаловать в Шарын! Нажимай на места, которые хочешь рассмотреть.',
    quest: [
      {
        type: 'talk', title: 'Помощник лесника',
        intro: { who: 'npc', text: 'Ко мне приехали туристы, а я один. Побудь моим помощником — ответь им, как настоящий лесник.' },
        steps: [
          { who: 'girl', say: 'Можно я отломаю ветку ясеня на память?', choices: [
            { t: 'Нельзя: это реликтовая роща, ей миллионы лет. Лучше подними с земли крылатку', ok: true, react: { who: 'girl', text: 'Ой, она кружится, как маленький вертолёт!', emo: 'happy' } },
            { t: 'Бери, их тут много', react: { who: 'npc', text: 'Стоп! Роща реликтовая, она под охраной национального парка.', emo: 'angry', gesture: 'stomp' }, hint: 'Согдийский ясень на дне Шарына — реликт, ему ломать ветки нельзя.' },
          ] },
          { who: 'dad', say: 'Мы хотим сфотографироваться на самом краю обрыва!', choices: [
            { t: 'Отойдите: глубина каньона до трёхсот метров, а край осыпается', ok: true, react: { who: 'dad', text: 'Ого, правда высоко. Сфотографируемся у ограждения.', emo: 'surprised' } },
            { t: 'Конечно, оттуда лучший вид', react: { who: 'npc', text: 'Назад! Край осыпается, а внизу до трёхсот метров!', emo: 'worried' }, hint: 'Стены каньона уходят вниз на 150–300 метров.' },
          ] },
          { who: 'girl', say: 'А кто построил эти замки? Великаны?', choices: [
            { t: 'Ветер и вода: тысячи лет они точили песчаник и глину', ok: true, react: { who: 'girl', text: 'Значит, ветер — самый терпеливый строитель!', emo: 'happy' } },
            { t: 'Да, древние великаны', react: { who: 'dad', text: 'Хм, а мне кажется, это сказка. Лесник, как на самом деле?', emo: 'thinking' }, hint: '«Замки» Долины замков выточили ветер и вода.' },
            { t: 'Их построили для кино', react: { who: 'girl', text: 'Нет, они настоящие! Я трогала!', emo: 'confused' } },
          ] },
        ],
        done: { who: 'npc', text: 'Ты настоящий помощник лесника! А теперь самое важное дело — соберём семена для новой рощи.' },
      },
      { type: 'game', win: 'Полная корзина крылаток! Весной у реки вырастут новые ясени.', lose: 'Несколько семян всё-таки есть. Посадим и их.' },
    ],
    time: { who: null, at: ['seed', 'river'], scene: { kind: 'forest' } },
  },

  altynemel: {
    npc: 'dana', pitch: 220,
    facts: ['dune', 'kalkan', 'kulans', 'besshatyr', 'saddle'],
    explore: 'Слышишь гул? Это поёт бархан. Нажимай на места, которые хочешь рассмотреть.',
    quest: [
      { type: 'game', win: 'Отличные кадры!', lose: 'Плёнка кончилась, но пару снимков мы сделали.' },
      {
        type: 'arrange', mode: 'match', title: 'Стенд у входа',
        intro: 'Теперь подпиши фотографии для стенда — посетители должны узнать каждого зверя. Одна подпись здесь лишняя!',
        slots: [{ id: 'kulan', label: 'Фото 1', beast: 'kulan' }, { id: 'jeyran', label: 'Фото 2', beast: 'jeyran' }, { id: 'arkhar', label: 'Фото 3', beast: 'arkhar' }],
        cards: [
          { id: 'k', t: 'Кулан: его предков привезли с острова Барсакельмес в 1980-х', ok: 'kulan' },
          { id: 'j', t: 'Джейран: самый быстрый, с рогами, изогнутыми как лира', ok: 'jeyran' },
          { id: 'a', t: 'Архар: горный баран с тяжёлыми закрученными рогами', ok: 'arkhar' },
          { id: 'x', t: 'Тюлень: живёт только в Каспийском море', ok: null },
        ],
        hint: 'Смотри на рога и уши: у кулана длинные уши и нет рогов, у джейрана рога как лира, у архара — закрученные.',
        done: 'Стенд готов! Теперь каждый посетитель узнает наших зверей.',
      },
    ],
    time: { who: 'zoologist', hello: 'Ты откуда здесь, на острове? Ладно, помогай — сегодня важный день!', name: 'Зоолог', role: '1982 год', at: ['@era', 'kulans'], scene: { kind: 'island' } },
  },

  balkhash: {
    npc: 'kairat', pitch: 115,
    extras: [{ id: 'kid', rig: 'ayaru', name: 'Айару', role: 'внучка', pitch: 340, x: 795, color: '#2E9AA8' }],
    facts: ['halves', 'river', 'legend', 'tigers'],
    explore: 'Попробуй воду, батыр! Нажимай на места у озера — я расскажу.',
    quest: [
      {
        type: 'arrange', mode: 'order', title: 'Легенда о Балхаше', pics: true,
        intro: 'Внучка просит сказку, а я всё перепутал! Разложи картинки по порядку, и я расскажу легенду как следует.',
        slots: [{ id: 0, label: '1' }, { id: 1, label: '2' }, { id: 2, label: '3' }, { id: 3, label: '4' }],
        cards: [
          { id: 'l1', t: 'Дочь Балхаша Или полюбила пастуха Каратала', ok: 0, pic: 'love' },
          { id: 'l2', t: 'Отец запретил им быть вместе', ok: 1, pic: 'father' },
          { id: 'l3', t: 'Влюблённые убежали', ok: 2, pic: 'run' },
          { id: 'l4', t: 'Балхаш превратил их в реки, а сам лёг между ними озером', ok: 3, pic: 'lake' },
        ],
        hint: 'Сначала любовь, потом запрет отца, потом побег — и только в конце волшебство.',
        tell: [
          { who: 'npc', text: 'Жил богатый Балхаш, и была у него дочь-красавица Или. Полюбила она бедного пастуха Каратала.' },
          { who: 'npc', text: 'Отец разгневался и запретил им видеться. Тогда влюблённые сели на коней и убежали.' },
          { who: 'npc', text: 'Балхаш превратил их в две реки, а сам лёг между ними озером, чтобы они никогда не встретились.' },
          { who: 'kid', text: 'Как грустно… Но зато реки до сих пор текут рядом!', emo: 'sad' },
        ],
        done: 'Вот теперь легенда правильная. Рахмет, батыр! А теперь помоги старику с уловом.',
      },
      { type: 'game', win: 'Вот это улов! И озеро стало чище.', lose: 'Ничего, рыбалка — дело терпеливых.' },
    ],
    time: { who: 'hunter', hello: 'Тсс… Не шуми. В этих камышах живёт хозяин тугаев.', name: 'Старый охотник', role: '1930-е годы', at: ['tracks', '@era'], scene: { kind: 'tugai' } },
  },

  altai: {
    npc: 'bakyt', pitch: 120,
    facts: ['belukha', 'forest', 'kurgans', 'valley', 'jailau'],
    explore: 'Красиво у нас? Нажимай на то, что хочешь рассмотреть.',
    quest: [
      {
        type: 'talk', title: 'Кочёвка маралов',
        intro: { who: 'npc', text: 'Пора перегонять маралов. Помоги мне спланировать путь — посмотрим, знаешь ли ты горы.' },
        steps: [
          { who: 'npc', say: 'Сейчас начало лета. Куда поведём стадо?', choices: [
            { t: 'На жайлау — высокогорные пастбища: там прохладно и трава сочная', ok: true, react: { who: 'npc', text: 'Верно! Летом — на жайлау, зимой — вниз, на қыстау.', emo: 'happy' } },
            { t: 'Вниз, в долину на қыстау', react: { who: 'npc', text: 'Қыстау — это зимовка! Летом в долине жарко, а трава выгорает.', emo: 'thinking' }, hint: 'Жаз — лето: летние пастбища называются жайлау.' },
          ] },
          { who: 'npc', say: 'Видишь двуглавую вершину в снегах? Это наш ориентир. Как она называется?', choices: [
            { t: 'Белуха, по-казахски Мұзтау — высшая точка Алтая, 4 506 метров', ok: true, react: { who: 'npc', text: 'Молодец! С её ледников бегут наши реки.', emo: 'proud' } },
            { t: 'Эверест', react: { who: 'npc', text: 'Эверест далеко, в Гималаях, и он вдвое выше.', emo: 'laugh' }, hint: 'Двуглавая вершина Алтая — Белуха, Мұзтау, 4 506 м.' },
            { t: 'Кокшетау', react: { who: 'npc', text: 'Кокшетау — гора в Бурабае, она ниже тысячи метров.', emo: 'thinking' } },
          ] },
          { who: 'npc', say: 'Маралы разбрелись по склонам. Кто быстрее всех их найдёт?', choices: [
            { t: 'Беркут Қыран — сверху ему видна вся долина', ok: true, react: { who: 'eagle', text: 'Кья-я! Я готов! Только помоги мне облететь скалы.', emo: 'happy' } },
            { t: 'Подождём, пока они сами вернутся', react: { who: 'npc', text: 'Так мы до осени прождём!', emo: 'laugh' }, hint: 'Беркутчи веками охотились и искали стада с беркутами.' },
          ] },
        ],
      },
      { type: 'game', win: 'Все маралы найдены! Ведём их на жайлау.', lose: 'Несколько маралов мы всё-таки нашли.' },
    ],
    time: { who: 'pazyryk', hello: 'Ты пришёл издалека, путник. Здесь, в долине Берель, кочует наш род.', name: 'Старик', role: 'житель Береля, 2300 лет назад', at: ['@era', 'people'], scene: { kind: 'peak', variant: 'past' } },
  },

  burabay: {
    npc: 'akbope', pitch: 190,
    extras: [{ id: 'kid', rig: 'erlan', name: 'Ерлан', role: 'внук', pitch: 320, x: 905, color: '#2E6A9A' }],
    facts: ['kokshetau', 'okzhetpes', 'glade', 'bura', 'pines'],
    explore: 'Садись поближе, балам. Нажимай на места вокруг — у каждого своя легенда.',
    quest: [
      {
        type: 'arrange', mode: 'place', title: 'Подпиши панораму',
        intro: 'Внук Ерлан нарисовал наше озеро, но перепутал все названия. Перетащи подписи на нужные места прямо на картинке.',
        cards: [
          { id: 'o', t: 'Окжетпес', clue: 'скала из круглых глыб — «стрела не долетит»', ok: 'okzhetpes' },
          { id: 'z', t: 'Жумбактас', clue: '«загадочный камень» прямо в озере', ok: 'zhumbaktas' },
          { id: 'k', t: 'Кокшетау', clue: 'самая высокая гора здесь, около 947 м', ok: 'kokshetau' },
          { id: 'g', t: 'Поляна Абылай хана', clue: 'поляна, где собирались батыры', ok: 'glade' },
        ],
        hint: 'Окжетпес — высокая скала из глыб у берега, Жумбактас — камень в воде, Кокшетау — гора в соснах вдали, поляна — у флажка.',
        done: 'Вот теперь всё на месте! А ну-ка, батыр, как в старину у Абылая, — устроим жамбы ату! Ерлан давно хочет посмотреть.',
      },
      { type: 'game', win: 'Дәл тидің! Ерлан будет рассказывать об этом всей улице.', lose: 'Ничего, даже до вершины Окжетпес ни одна стрела не долетела.' },
    ],
    time: { who: 'batyr', hello: 'Ассалаумағалейкум, жас батыр! Подсаживайся к нашему огню.', name: 'Батыр', role: 'XVIII век', at: ['fire', 'bura'], scene: { kind: 'pinelake', tone: 'night' } },
  },

  ulytau: {
    npc: 'erzhan', pitch: 130,
    facts: ['mountains', 'mausoleum', 'kulans', 'copper', '@npc'],
    explore: 'Ұлытау — сердце степи. Нажимай на то, что хочешь рассмотреть.',
    quest: [
      {
        type: 'talk', title: 'На месте Кетбуги',
        intro: { who: 'npc', text: 'Чтобы сыграть кюй, нужно понять его историю. Представь, что ты — кюйши Кетбуга.' },
        steps: [
          { who: 'npc', say: 'Хан запретил говорить о гибели сына — за такую весть он грозил казнью. Как ты сообщишь ему правду?', choices: [
            { t: 'Сыграю кюй — пусть музыка расскажет без слов', ok: true, react: { who: 'npc', text: 'Так и сделал Кетбуга. Музыке не нужны слова.', emo: 'proud' } },
            { t: 'Напишу письмо', react: { who: 'npc', text: 'Письмо — тоже слова, а за слова хан грозил казнью.', emo: 'thinking' }, hint: 'Кетбуга не сказал ни слова — он сыграл на домбре.' },
            { t: 'Промолчу', react: { who: 'npc', text: 'Но хан всё равно должен узнать правду…', emo: 'sad' } },
          ] },
          { who: 'npc', say: 'Что должна рассказать домбра?', choices: [
            { t: 'Топот хромого кулана, плач и вой ветра', ok: true, react: { who: 'npc', text: 'Да. «Ақсақ құлан» — «Хромой кулан».', emo: 'happy' } },
            { t: 'Весёлую свадебную песню', react: { who: 'npc', text: 'Весть-то горькая… Подумай ещё.', emo: 'sad' }, hint: 'Кюй называется «Ақсақ құлан» — «Хромой кулан».' },
          ] },
          { who: 'npc', say: 'А что, по легенде, сделали с домброй после этого?', choices: [
            { t: 'Залили свинцом — так на деке появилось круглое отверстие', ok: true, react: { who: 'npc', text: 'Верно! Хан сдержал клятву по-своему.', emo: 'proud' } },
            { t: 'Разбили о камень', react: { who: 'npc', text: 'Нет, домбра уцелела — и в ней осталась память об этом.', emo: 'thinking' }, hint: 'Вспомни про свинец и круглое отверстие на деке.' },
          ] },
        ],
        done: { who: 'npc', text: 'Теперь ты знаешь, как рождается кюй. Сыграем вместе!' },
      },
      { type: 'game', win: 'Домбра пела у тебя в руках! Кетбуга бы тобой гордился.', lose: 'Кюй — это годы учёбы. Начало положено!' },
    ],
    time: { who: 'ketbuga', hello: 'Ты видишь мою беду, путник. Мне нужно идти к хану с горькой вестью.', name: 'Кетбуга', role: 'кюйши, XIII век', at: ['@era', 'ordo'], scene: { kind: 'camp', tone: 'dusk', ordo: true } },
  },

  aral: {
    npc: 'tolegen', pitch: 105,
    facts: ['shore', 'ships', 'dam', 'wagon'],
    explore: 'Смотри, батыр. Нажимай на места вокруг — я расскажу, как здесь было.',
    quest: [
      {
        type: 'arrange', mode: 'match', title: 'Музей Аральска',
        intro: 'В нашем маленьком музее перепутались таблички. Подбери к каждому году своё событие.',
        slots: [{ id: 'y1', label: '1921' }, { id: 'y2', label: '1960-е' }, { id: 'y3', label: 'конец 1980-х' }, { id: 'y4', label: '2005' }],
        cards: [
          { id: 'e1', icon: 'train', t: 'Рыбаки Аральска отправляют вагоны рыбы голодающему Поволжью', ok: 'y1' },
          { id: 'e2', icon: 'cotton', t: 'Воду Сырдарьи и Амударьи разбирают на поля хлопка и риса', ok: 'y2' },
          { id: 'e3', icon: 'split', t: 'Море мелеет и распадается на части', ok: 'y3' },
          { id: 'e4', icon: 'dam', t: 'Построена Кокаральская плотина — в Малый Арал возвращается рыба', ok: 'y4' },
        ],
        hint: 'Сначала море было полным и кормило других, потом воду забрали на поля, море распалось — и только потом его начали спасать.',
        done: 'Всё верно. Рахмет, балам. Помоги теперь удержать воду в Малом Арале — у плотины снова течь.',
      },
      { type: 'game', win: 'Плотина держит! Вода поднялась, и рыба вернулась.', lose: 'Вода ещё уходит, но мы будем чинить плотину дальше.' },
    ],
    time: { who: 'brigadier', hello: 'Эй, помощник! Ты как раз вовремя — сегодня сети полны рыбы!', name: 'Бригадир', role: 'рыбак, 1960 год', at: ['nets', 'horizon'], scene: { kind: 'port' } },
  },

  mangystau: {
    npc: 'alia', pitch: 215,
    facts: ['karagiye', 'cliffs', 'beket', 'mouflon', 'sherkala'],
    explore: 'Ты стоишь на дне древнего океана! Нажимай на места вокруг.',
    quest: [
      { type: 'game', win: 'Все окаменелости найдены! Музей будет счастлив.', lose: 'Кое-что мы всё же откопали.' },
      {
        type: 'proofread', title: 'Полевой отчёт', doc: 'report',
        intro: 'Студент-практикант заснул над отчётом и наделал ошибок. Помоги исправить, пока не увидел профессор!',
        parts: [
          'Сегодня в урочище Бозжыра нашли ', { t: 'аммониты', opts: ['аммониты', 'динозавров', 'мамонтов'], ok: 'аммониты' },
          ' и окаменевших морских ежей. Эти животные жили в океане ', { t: 'Тетис', opts: ['Тихом', 'Тетис', 'Северном Ледовитом'], ok: 'Тетис' },
          ' около ', { t: 'ста тысяч', opts: ['ста лет', 'ста тысяч', 'ста миллионов'], ok: 'ста миллионов', why: 'Океан Тетис плескался здесь около ста миллионов лет назад.' },
          ' лет назад. Скалы здесь белые, потому что сложены из ', { t: 'гранита', opts: ['гранита', 'мела и известняка', 'льда'], ok: 'мела и известняка', why: 'Белые скалы — это мел и известняк из крошечных раковин.' },
          '. Рядом впадина Карагие: она опускается на ', { t: '13', opts: ['13', '132', '1 320'], ok: '132', why: 'Карагие — 132 метра ниже уровня моря.' },
          ' метров ниже уровня моря. А в Каспии живёт ', { t: 'морж', opts: ['морж', 'каспийский тюлень', 'кит'], ok: 'каспийский тюлень', why: 'Каспийский тюлень не встречается больше нигде.' }, ', которого больше нигде нет.',
        ],
        done: 'Отчёт как у настоящего геолога! Профессор будет доволен.',
      },
    ],
    time: { who: null, at: ['ammonite', 'floor'], scene: { kind: 'ocean' } },
  },
};

// начальная и финальная сцены
export const INTRO_STAGE = { kind: 'kazygurt', guide: 'sapar', acts: [{ at: 'ark' }, { at: 'view' }, {}, { eagle: true }, {}] };
export const ENDING_STAGE = { kind: 'camp', tone: 'night' };
