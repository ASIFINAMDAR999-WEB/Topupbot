// index.js – Complete Telegram Top-Up Bot with full plan details, payment flow, and admin notifications

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Replace with your actual bot token
const TOKEN = '8111508881:AAFGA72emZedDawRuOwLmqiqsA_3wvs_sIA';
const ADMIN_ID = 7830539814;

const bot = new TelegramBot(TOKEN, {
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  }
});

// In-memory storage
const users = new Map();       // Map<chatId, { lang, plan, crypto }>
let purchaseLogs = [];         // Array of { user, plan, crypto, time }
const cryptos = [
  { name: 'USDT (TRC20)', address: 'THcpxC6Tzye4vaYxLcP2ufkbhy7XMCVdRc' },
  { name: 'BTC',            address: 'bc1q5clkxvk8u9lgfdkq2njutcd0pmxpe08um4mdyw' },
  { name: 'ETH',            address: '0x36da8622EBdD7BF9AA6668fb68Ec18870CCCDAAC' }
];

// Multi-language translations
const translations = {
  en: {
    welcome: "🌟 Welcome to Call Spoofing Services!\nChoose your language:",
    choose_plan: "✅ CHOOSE YOUR PLAN ✅\n──────────────",
    payment: "💳 *{plan}*\n{description}\n\nSelect payment method:",
    payment_instruction: "✅ Please send *{method}* to:\n```{address}```",
    payment_done: "✅ Payment Done",
    ask_screenshot: "📸 Please send your payment screenshot now.",
    language_set: "🌐 Language set to English",
    demo_video: "🎥 Demo Video",
    admin_panel: "🛠 ADMIN PANEL",
    admin_logs: "📋 Last 20 Logs",
    admin_broadcast: "📢 Broadcast",
    admin_users: "👤 User Count",
    help: `📌 *How to Use*:
1. Choose your plan
2. Select payment method
3. Send crypto to provided address
4. Click 'Payment Done' and send payment screenshot
5. Get your credentials within 15 minutes`,
    back: "🔙 Back",
    main_menu: "🏠 Main Menu",
    select_lang: "🌐 Select Language"
  },
  fr: {
    welcome: "🌟 Bienvenue aux services de spoofing d'appel !\nChoisissez votre langue:",
    choose_plan: "✅ CHOISISSEZ VOTRE FORFAIT ✅\n──────────────",
    payment: "💳 *{plan}*\n{description}\n\nSélectionnez le mode de paiement:",
    payment_instruction: "✅ Veuillez envoyer *{method}* à :\n```{address}```",
    payment_done: "✅ Paiement effectué",
    ask_screenshot: "📸 Veuillez envoyer votre capture d’écran du paiement maintenant.",
    language_set: "🌐 Langue définie sur Français",
    demo_video: "🎥 Vidéo de démonstration",
    admin_panel: "🛠 PANEL ADMIN",
    admin_logs: "📋 20 derniers logs",
    admin_broadcast: "📢 Diffusion",
    admin_users: "👤 Nombre d'utilisateurs",
    help: `📌 *Mode d'emploi* :
1. Choisissez votre forfait
2. Sélectionnez le mode de paiement
3. Envoyez les crypto-monnaies à l'adresse fournie
4. Cliquez sur 'Paiement effectué' et envoyez la capture d’écran
5. Recevez vos identifiants dans les 15 minutes`,
    back: "🔙 Retour",
    main_menu: "🏠 Menu Principal",
    select_lang: "🌐 Choisir la langue"
  },
  de: {
    welcome: "🌟 Willkommen beim Call Spoofing Service!\nWählen Sie Ihre Sprache:",
    choose_plan: "✅ WÄHLEN SIE IHREN PLAN ✅\n──────────────",
    payment: "💳 *{plan}*\n{description}\n\nWählen Sie eine Kryptowährung:",
    payment_instruction: "✅ Bitte senden Sie *{method}* an:\n```{address}```",
    payment_done: "✅ Ich habe bezahlt",
    ask_screenshot: "📸 Bitte senden Sie jetzt Ihren Zahlungsnachweis.",
    language_set: "🌐 Sprache auf Deutsch eingestellt",
    demo_video: "🎥 Demovideo",
    admin_panel: "🛠 ADMIN-PANEL",
    admin_logs: "📋 Letzte 20 Logs",
    admin_broadcast: "📢 Rundsendung",
    admin_users: "👤 Benutzeranzahl",
    help: `📌 *Anleitung*:
1. Wählen Sie Ihren Plan
2. Wählen Sie Zahlungsmethode
3. Kryptowährung an die angegebene Adresse senden
4. Klicken Sie auf 'Ich habe bezahlt' und senden Sie den Nachweis
5. Erhalten Sie Ihre Zugangsdaten innerhalb von 15 Minuten`,
    back: "🔙 Zurück",
    main_menu: "🏠 Hauptmenü",
    select_lang: "🌐 Sprache wählen"
  },
  es: {
    welcome: "🌟 ¡Bienvenido a los servicios de suplantación de llamadas!\nElija su idioma:",
    choose_plan: "✅ ELIJA SU PLAN ✅\n──────────────",
    payment: "💳 *{plan}*\n{description}\n\nSeleccione método de pago:",
    payment_instruction: "✅ Envíe *{method}* a:\n```{address}```",
    payment_done: "✅ He Pagado",
    ask_screenshot: "📸 Envíe ahora su comprobante de pago.",
    language_set: "🌐 Idioma establecido en Español",
    demo_video: "🎥 Video Demostrativo",
    admin_panel: "🛠 PANEL ADMIN",
    admin_logs: "📋 Últimos 20 registros",
    admin_broadcast: "📢 Transmisión",
    admin_users: "👤 Recuento de usuarios",
    help: `📌 *Instrucciones*:
1. Elija su plan
2. Seleccione método de pago
3. Envíe criptomonedas a la dirección proporcionada
4. Haga clic en 'He Pagado' y envíe el comprobante
5. Reciba sus credenciales en 15 minutos`,
    back: "🔙 Atrás",
    main_menu: "🏠 Menú Principal",
    select_lang: "🌐 Seleccionar idioma"
  },
  ru: {
    welcome: "🌟 Добро пожаловать в сервисы спуфинга звонков!\nВыберите язык:",
    choose_plan: "✅ ВЫБЕРИТЕ ТАРИФ ✅\n──────────────",
    payment: "💳 *{plan}*\n{description}\n\nВыберите способ оплаты:",
    payment_instruction: "✅ Отправьте *{method}* на:\n```{address}```",
    payment_done: "✅ Я оплатил",
    ask_screenshot: "📸 Пожалуйста, отправьте подтверждение оплаты сейчас.",
    language_set: "🌐 Язык изменен на Русский",
    demo_video: "🎥 Демо-видео",
    admin_panel: "🛠 АДМИН ПАНЕЛЬ",
    admin_logs: "📋 Последние 20 записей",
    admin_broadcast: "📢 Рассылка",
    admin_users: "👤 Количество пользователей",
    help: `📌 *Инструкция*:
1. Выберите тариф
2. Выберите способ оплаты
3. Отправьте криптовалюту на указанный адрес
4. Нажмите 'Я оплатил' и отправьте подтверждение
5. Получите учетные данные в течение 15 минут`,
    back: "🔙 Назад",
    main_menu: "🏠 Главное меню",
    select_lang: "🌐 Выбрать язык"
  }
};

// Plan details
const plansData = {
  en: [
    {
      id: 'gold',
      name: '⭐ SILVER PLANS ⭐',
      description:
        '$25 | $50 | $100 | $250 | $500\n\n' +
        '• Manual top-up via @AF3092\n' +
        '• Per-minute billing (varies by country)\n'
    },
    {
      id: 'gold_unl',
      name: '⭐ GOLD PLAN — $90 ⭐',
      description:
        '1️⃣ Month Unlimited Calling — no per-minute charges\n\n' +
        'Includes:\n' +
        '• Full Call Spoofing Access\n' +
        '• Standard Voice Changer\n' +
        '• Website & Application Access\n'
    },
    {
      id: 'diamond',
      name: '⭐ DIAMOND PLAN — $200 ⭐',
      description:
        '2️⃣ Months Unlimited Calling — no per-minute charges\n\n' +
        'Includes:\n' +
        '• Advanced Call Spoofing\n' +
        '• Premium Voice Changer\n' +
        '• Enhanced Call Routing\n' +
        '• Advance OTP Bot Access\n' +
        '• Website & Application Access\n' +
        '• Email & SMS Spoofing Access\n' +
        '• IVR System\n' +
        '• Toll-Free Number Spoofing\n' +
        '• SIP Trunk Access (inbound & outbound)\n'
    },
    {
      id: 'platinum',
      name: '⭐ PLATINUM PLAN — $300 ⭐',
      description:
        '3️⃣ Months Unlimited Calling — no per-minute charges\n\n' +
        'Includes all premium features:\n' +
        '• Advanced Call Spoofing\n' +
        '• Premium Voice Changer\n' +
        '• Enhanced Routing\n' +
        '• Priority Support\n' +
        '• Advance OTP Bot Access\n' +
        '• Full API & Custom Integration\n' +
        '• Website & Application Access\n' +
        '• Email & SMS Spoofing Access\n' +
        '• IVR System\n' +
        '• Premium Toll-Free Number Spoofing\n' +
        '• Premium SIP Trunk Access (inbound & outbound, with dedicated routing and enhanced quality)\n\n' +
        '📌 As an introductory offer, the Platinum Plan is available for 1 Month at $100 — For New Clients Only\n'
    }
  ],
  fr: [
    {
      id: 'gold',
      name: '⭐ FORFAITS SILVER ⭐',
      description:
        '$25 | $50 | $100 | $250 | $500\n\n' +
        '• Recharge manuelle via @AF3092\n' +
        '• Facturation à la minute (varie selon le pays)\n'
    },
    {
      id: 'gold_unl',
      name: '⭐ FORFAIT OR — $90 ⭐',
      description:
        '1️⃣ Mois d’appels illimités — pas de facturation à la minute\n\n' +
        'Inclut :\n' +
        '• Accès complet au spoofing d’appel\n' +
        '• Changeur de voix standard\n' +
        '• Accès site et application\n'
    },
    {
      id: 'diamond',
      name: '⭐ FORFAIT DIAMANT — $200 ⭐',
      description:
        '2️⃣ Mois d’appels illimités — pas de facturation à la minute\n\n' +
        'Inclut :\n' +
        '• Spoofing d’appel avancé\n' +
        '• Changeur de voix premium\n' +
        '• Routage d’appel amélioré\n' +
        '• Accès Bot OTP avancé\n' +
        '• Accès site et application\n' +
        '• Spoofing email & SMS\n' +
        '• Système IVR\n' +
        '• Spoofing de numéro gratuit\n' +
        '• Accès SIP Trunk (entrant & sortant)\n'
    },
    {
      id: 'platinum',
      name: '⭐ FORFAIT PLATINE — $300 ⭐',
      description:
        '3️⃣ Mois d’appels illimités — pas de facturation à la minute\n\n' +
        'Inclut toutes les fonctionnalités premium :\n' +
        '• Spoofing d’appel avancé\n' +
        '• Changeur de voix premium\n' +
        '• Routage amélioré\n' +
        '• Support prioritaire\n' +
        '• Accès Bot OTP avancé\n' +
        '• API & intégration personnalisée\n' +
        '• Accès site et application\n' +
        '• Spoofing email & SMS\n' +
        '• Système IVR\n' +
        '• Spoofing de numéro gratuit premium\n' +
        '• Accès SIP Trunk premium (entrant & sortant, routage dédié et qualité améliorée)\n\n' +
        '📌 Offre d’introduction : Forfait Platine à $100 pour 1 mois — Pour Nouveaux Clients\n'
    }
  ],
  de: [
    {
      id: 'gold',
      name: '⭐ SILBER-PAKETE ⭐',
      description:
        '$25 | $50 | $100 | $250 | $500\n\n' +
        '• Manuelle Aufladung via @AF3092\n' +
        '• Abrechnung pro Minute (je nach Land)\n'
    },
    {
      id: 'gold_unl',
      name: '⭐ GOLD-PAKET — $90 ⭐',
      description:
        '1️⃣ Monat unbegrenzt telefonieren — keine Minutengebühren\n\n' +
        'Enthält:\n' +
        '• Vollständiges Call Spoofing\n' +
        '• Standard-Sprachwechsler\n' +
        '• Website- & App-Zugriff\n'
    },
    {
      id: 'diamond',
      name: '⭐ DIAMANT-PAKET — $200 ⭐',
      description:
        '2️⃣ Monate unbegrenzt telefonieren — keine Minutengebühren\n\n' +
        'Enthält:\n' +
        '• Fortgeschrittenes Call Spoofing\n' +
        '• Premium-Sprachwechsler\n' +
        '• Verbesserte Anrufweiterleitung\n' +
        '• Fortgeschrittener OTP-Bot-Zugriff\n' +
        '• Website- & App-Zugriff\n' +
        '• E-Mail- & SMS-Spoofing\n' +
        '• IVR-System\n' +
        '• Kostenlose Nummern-Spoofing\n' +
        '• SIP-Trunk-Zugriff (eingehend & ausgehend)\n'
    },
    {
      id: 'platinum',
      name: '⭐ PLATIN-PAKET — $300 ⭐',
      description:
        '3️⃣ Monate unbegrenzt telefonieren — keine Minutengebühren\n\n' +
        'Enthält alle Premium-Funktionen:\n' +
        '• Fortgeschrittenes Call Spoofing\n' +
        '• Premium-Sprachwechsler\n' +
        '• Verbesserte Weiterleitung\n' +
        '• Priorisierter Support\n' +
        '• Fortgeschrittener OTP-Bot-Zugriff\n' +
        '• Vollständige API- & benutzerdefinierte Integration\n' +
        '• Website- & App-Zugriff\n' +
        '• E-Mail- & SMS-Spoofing\n' +
        '• IVR-System\n' +
        '• Premium Toll-Free Number Spoofing\n' +
        '• Premium SIP-Trunk-Zugriff (eingehend & ausgehend, dediziertes Routing und verbesserte Qualität)\n\n' +
        '📌 Einführungsangebot: Platinum-Paket 1 Monat für $100 — Nur für neue Kunden\n'
    }
  ],
  es: [
    {
      id: 'gold',
      name: '⭐ PLANES PLATA ⭐',
      description:
        '$25 | $50 | $100 | $250 | $500\n\n' +
        '• Recarga manual via @AF3092\n' +
        '• Facturación por minuto (varía por país)\n'
    },
    {
      id: 'gold_unl',
      name: '⭐ PLAN ORO — $90 ⭐',
      description:
        '1️⃣ Mes Llamadas Ilimitadas — sin cargos por minuto\n\n' +
        'Incluye:\n' +
        '• Acceso completo a Call Spoofing\n' +
        '• Cambiador de voz estándar\n' +
        '• Acceso web y app\n'
    },
    {
      id: 'diamond',
      name: '⭐ PLAN DIAMANTE — $200 ⭐',
      description:
        '2️⃣ Meses Llamadas Ilimitadas — sin cargos por minuto\n\n' +
        'Incluye:\n' +
        '• Spoofing de llamada avanzado\n' +
        '• Cambiador de voz premium\n' +
        '• Enrutamiento de llamadas mejorado\n' +
        '• Acceso avanzado a Bot OTP\n' +
        '• Acceso web y app\n' +
        '• Spoofing de Email y SMS\n' +
        '• Sistema IVR\n' +
        '• Spoofing de número gratuito\n' +
        '• Acceso SIP Trunk (entrante y saliente)\n'
    },
    {
      id: 'platinum',
      name: '⭐ PLAN PLATINO — $300 ⭐',
      description:
        '3️⃣ Meses Llamadas Ilimitadas — sin cargos por minuto\n\n' +
        'Incluye todas las funciones premium:\n' +
        '• Spoofing de llamada avanzado\n' +
        '• Cambiador de voz premium\n' +
        '• Enrutamiento mejorado\n' +
        '• Soporte prioritario\n' +
        '• Acceso avanzado a Bot OTP\n' +
        '• API completa e integración personalizada\n' +
        '• Acceso web y app\n' +
        '• Spoofing de Email y SMS\n' +
        '• Sistema IVR\n' +
        '• Spoofing de número gratuito premium\n' +
        '• Acceso SIP Trunk premium (entrante y saliente, enrutamiento dedicado y calidad mejorada)\n\n' +
        '📌 Oferta introductoria: Plan Platino 1 Mes por $100 — Solo para nuevos clientes\n'
    }
  ],
  ru: [
    {
      id: 'gold',
      name: '⭐ СЕРЕБРЯНЫЕ ТАРИФЫ ⭐',
      description:
        '$25 | $50 | $100 | $250 | $500\n\n' +
        '• Ручное пополнение через @AF3092\n' +
        '• Плата за минуту (зависит от страны)\n'
    },
    {
      id: 'gold_unl',
      name: '⭐ ЗОЛОТОЙ ТАРИФ — $90 ⭐',
      description:
        '1️⃣ Месяц безлимитных звонков — без поминутной платы\n\n' +
        'Включает:\n' +
        '• Полный Call Spoofing\n' +
        '• Стандартный сменщик голоса\n' +
        '• Доступ к веб-сайту и приложению\n'
    },
    {
      id: 'diamond',
      name: '⭐ БРИЛЛИАНТОВЫЙ ТАРИФ — $200 ⭐',
      description:
        '2️⃣ Месяца безлимита — без поминутной платы\n\n' +
        'Включает:\n' +
        '• Продвинутый Call Spoofing\n' +
        '• Премиум сменщик голоса\n' +
        '• Улучшенное маршрутизация звонков\n' +
        '• Продвинутый доступ к Bot OTP\n' +
        '• Доступ к веб-сайту и приложению\n' +
        '• Spoofing Email и SMS\n' +
        '• Система IVR\n' +
        '• Spoofing бесплатного номера\n' +
        '• Доступ SIP Trunk (входящий и исходящий)\n'
    },
    {
      id: 'platinum',
      name: '⭐ ПЛАТИНОВЫЙ ТАРИФ — $300 ⭐',
      description:
        '3️⃣ Месяца безлимита — без поминутной платы\n\n' +
        'Включает все премиум-функции:\n' +
        '• Продвинутый Call Spoofing\n' +
        '• Премиум сменщик голоса\n' +
        '• Улучшенное маршрутизация\n' +
        '• Приоритетная поддержка\n' +
        '• Продвинутый доступ к Bot OTP\n' +
        '• Полная API и кастомная интеграция\n' +
        '• Доступ к веб-сайту и приложению\n' +
        '• Spoofing Email и SMS\n' +
        '• Система IVR\n' +
        '• Spoofing премиум бесплатного номера\n' +
        '• Премиум доступ SIP Trunk (входящий и исходящий, выделенное маршрутизация и повышенное качество)\n\n' +
        '📌 Промо: Платиновый тариф 1 месяц за $100 — Только для новых клиентов\n'
    }
  ]
};

// Simulate typing action
const animateTyping = (chatId, duration = 500) => {
  bot.sendChatAction(chatId, 'typing');
  return new Promise(resolve => setTimeout(resolve, duration));
};

const sendAnimatedMessage = async (chatId, text, options = {}) => {
  await animateTyping(chatId);
  return bot.sendMessage(chatId, text, options);
};

// 1) Send language menu
const sendLanguageMenu = async (chatId) => {
  const keyboard = {
    inline_keyboard: [
      [{ text: '🇺🇸 English', callback_data: 'lang_en' }],
      [{ text: '🇫🇷 Français', callback_data: 'lang_fr' }],
      [{ text: '🇩🇪 Deutsch',   callback_data: 'lang_de' }],
      [{ text: '🇪🇸 Español',   callback_data: 'lang_es' }],
      [{ text: '🇷🇺 Русский',   callback_data: 'lang_ru' }]
    ]
  };
  await sendAnimatedMessage(chatId, translations.en.welcome, {
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  });
};

// 2) Send main menu (plans + demo + change lang + help)
const sendMainMenu = async (chatId, lang = 'en') => {
  const t = translations[lang];
  const pList = plansData[lang];
  const planButtons = pList.map(p => [{ text: p.name, callback_data: `buy_${p.id}` }]);
  planButtons.push([{ text: t.demo_video, url: 'https://t.me/Callspoofingbotofficial' }]);
  planButtons.push([{ text: t.select_lang, callback_data: 'change_lang' }]);
  planButtons.push([{ text: '❓ ' + t.help.split('\n')[0], callback_data: 'help' }]);
  
  const keyboard = { inline_keyboard: planButtons };
  await sendAnimatedMessage(chatId, t.choose_plan, {
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  });
};

// 3) Show payment methods for chosen plan
const showPaymentMethods = async (chatId, planId, lang = 'en') => {
  const t = translations[lang];
  const selected = plansData[lang].find(pl => pl.id === planId);
  if (!selected) {
    await sendMainMenu(chatId, lang);
    return;
  }
  
  // Log purchase
  purchaseLogs.unshift({
    user: chatId,
    plan: selected.name,
    crypto: null,
    time: new Date().toLocaleString()
  });
  if (purchaseLogs.length > 20) purchaseLogs.pop();
  
  const cryptoButtons = cryptos.map(c => [{ text: c.name, callback_data: `pay|${planId}|${c.name}` }]);
  cryptoButtons.push([{ text: t.back, callback_data: 'back_to_plans' }]);
  
  const keyboard = { inline_keyboard: cryptoButtons };
  await sendAnimatedMessage(chatId, t.payment
    .replace('{plan}', selected.name)
    .replace('{description}', selected.description), {
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  });
};

// 4) Send /help text
const sendHelp = async (chatId, lang = 'en') => {
  const t = translations[lang];
  const keyboard = { inline_keyboard: [[{ text: t.main_menu, callback_data: 'main_menu' }]] };
  await sendAnimatedMessage(chatId, t.help, {
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  });
};

// 5) Handle callback queries
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userEntry = users.get(chatId) || { lang: 'en' };
  const lang = userEntry.lang;
  const t = translations[lang];
  const data = query.data;
  
  // LANGUAGE SELECT
  if (data.startsWith('lang_')) {
    const newLang = data.split('_')[1];
    users.set(chatId, { lang: newLang });
    await bot.answerCallbackQuery(query.id, { text: translations[newLang].language_set });
    await sendMainMenu(chatId, newLang);
    return;
  }
  
  // CHANGE LANGUAGE
  if (data === 'change_lang') {
    await bot.answerCallbackQuery(query.id);
    await sendLanguageMenu(chatId);
    return;
  }
  
  // HELP
  if (data === 'help') {
    await bot.answerCallbackQuery(query.id);
    await sendHelp(chatId, lang);
    return;
  }
  
  // MAIN MENU
  if (data === 'main_menu') {
    await bot.answerCallbackQuery(query.id);
    await sendMainMenu(chatId, lang);
    return;
  }
  
  // BACK TO PLANS
  if (data === 'back_to_plans') {
    await bot.answerCallbackQuery(query.id);
    await sendMainMenu(chatId, lang);
    return;
  }
  
  // PLAN SELECTION
  if (data.startsWith('buy_')) {
    await bot.answerCallbackQuery(query.id);
    const planId = data.split('_')[1];
    await showPaymentMethods(chatId, planId, lang);
    return;
  }
  
  // PAYMENT METHOD SELECTION
  if (data.startsWith('pay|')) {
    await bot.answerCallbackQuery(query.id);
    const parts = data.split('|');
    const planId = parts[1];
    const method = parts[2];
    const wallet = cryptos.find(c => c.name === method);
    if (wallet) {
      // Update the last purchase log to include crypto
      purchaseLogs[0].crypto = method;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: t.payment_done, callback_data: `done|${planId}|${method}` }]
        ]
      };
      await sendAnimatedMessage(chatId, t.payment_instruction
        .replace('{method}', method)
        .replace('{address}', wallet.address), {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      });
    }
    return;
  }
  
  // PAYMENT DONE - ask for screenshot
  if (data.startsWith('done|')) {
    await bot.answerCallbackQuery(query.id);
    const [_, planId, method] = data.split('|');
    
    users.get(chatId).plan = planId;
    users.get(chatId).crypto = method;
    
    await sendAnimatedMessage(chatId, t.ask_screenshot, {
      parse_mode: 'Markdown'
    });
    return;
  }
  
  // ADMIN PANEL
  if (query.from.id === ADMIN_ID) {
    if (data === 'admin_logs') {
      await bot.answerCallbackQuery(query.id);
      const logsText = purchaseLogs.map(l =>
        `• ${l.user || 'Unknown'} - ${l.plan} - ${l.crypto || ''} (${l.time})`
      ).join('\n') || 'No logs yet';
      const keyboard = {
        inline_keyboard: [[{ text: '🔙 Back to Admin', callback_data: 'admin_panel' }]]
      };
      await bot.sendMessage(chatId, `📝 *Last 20 Purchases*\n${logsText}`, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      return;
    }
    
    if (data === 'admin_users') {
      await bot.answerCallbackQuery(query.id);
      const keyboard = {
        inline_keyboard: [[{ text: '🔙 Back to Admin', callback_data: 'admin_panel' }]]
      };
      await bot.sendMessage(chatId, `👥 *Total Users:* ${users.size}`, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      return;
    }
    
    if (data === 'admin_broadcast') {
      await bot.answerCallbackQuery(query.id);
      const keyboard = {
        inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
      };
      await bot.sendMessage(chatId, '📢 Send message or media to broadcast:', {
        reply_markup: keyboard
      });
      bot.once('message', async (m) => {
        if (m.text && m.text.toLowerCase() === '/cancel') return;
        let sentCount = 0;
        const totalUsers = users.size;
        for (const [uid] of users) {
          try {
            if (m.photo) {
              const fileId = m.photo[m.photo.length - 1].file_id;
              await bot.sendPhoto(uid, fileId, { caption: m.caption || '' });
            } else if (m.video) {
              await bot.sendVideo(uid, m.video.file_id, { caption: m.caption || '' });
            } else if (m.text) {
              await bot.sendMessage(uid, m.text);
            }
            sentCount++;
          } catch (_) {}
          await new Promise(r => setTimeout(r, 50));
        }
        const keyboard2 = {
          inline_keyboard: [[{ text: '🔙 Admin Panel', callback_data: 'admin_panel' }]]
        };
        await bot.sendMessage(chatId, `✅ Broadcast sent to ${sentCount}/${totalUsers} users.`, {
          reply_markup: keyboard2
        });
      });
      return;
    }
    
    if (data === 'admin_panel') {
      await bot.answerCallbackQuery(query.id);
      const keyboard = {
        inline_keyboard: [
          [{ text: '📋 Last 20 Logs', callback_data: 'admin_logs' }],
          [{ text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
          [{ text: '👤 User Count', callback_data: 'admin_users' }],
          [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
        ]
      };
      await sendAnimatedMessage(chatId, translations.en.admin_panel, { reply_markup: keyboard });
      return;
    }
  }
});

// Handle screenshots: forward to admin
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  if (!users.has(chatId)) return;
  const { plan, crypto } = users.get(chatId);
  if (!plan || !crypto) return;
  // Forward the photo to admin
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  await bot.sendPhoto(ADMIN_ID, fileId, {
    caption: `📸 Payment proof from @${msg.from.username || msg.from.first_name}\nPlan: ${plan}\nCrypto: ${crypto}`
  });
  await bot.sendMessage(chatId, "✅ Screenshot received. Our team will verify shortly.");
});

// COMMAND HANDLERS
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  if (!users.has(chatId)) users.set(chatId, { lang: 'en' });
  await sendLanguageMenu(chatId);
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = users.get(chatId)?.lang || 'en';
  await sendHelp(chatId, lang);
});

bot.onText(/\/language/, async (msg) => {
  const chatId = msg.chat.id;
  await sendLanguageMenu(chatId);
});

bot.onText(/\/admin/, async (msg) => {
  if (msg.from.id !== ADMIN_ID) return;
  const chatId = msg.chat.id;
  await sendAnimatedMessage(chatId, translations.en.admin_panel, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 Last 20 Logs', callback_data: 'admin_logs' }],
        [{ text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
        [{ text: '👤 User Count', callback_data: 'admin_users' }],
        [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
      ]
    }
  });
});

// Error handling
bot.on('polling_error', (error) => {
  console.error(`Polling error: ${error.message}`);
});

console.log('🚀 Bot is running with full features…');
