const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = '8284209775:AAGlzs-zMkFFFPBjjRbGYuJpeCAa_cEp5ik';
const API_URL = 'https://rowix.com/currencies.php';

const bot = new TelegramBot(TOKEN, { polling: true });

async function getCurrencyData() {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

function createKeyboard(data) {
    const keyboard = [[{ text: '/all' }]];
    let row = [];

    data.forEach((item, index) => {
        row.push({ text: item.code });
        if (row.length === 3) {
            keyboard.push(row);
            row = [];
        }
    });

    if (row.length > 0) {
        keyboard.push(row);
    }

    return keyboard;
}

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const data = await getCurrencyData();

    if (!data) {
        return bot.sendMessage(chatId, "Sorry, could not load data");
    }

    const welcomeMessage = `Hi! \nPlease choose the currency from the menu below or use /all to get All currency rates.`;

    bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
            keyboard: createKeyboard(data),
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
});

bot.onText(/\/all/, async (msg) => {
    const chatId = msg.chat.id;
    const data = await getCurrencyData();

    if (!data) {
        return bot.sendMessage(chatId, "Sorry, could not load data");
    }

    let responseText = "Live rates";
    data.forEach(item => {
        responseText += `**${item.code}**: \`${item.rate}\` ${item.symbol}\n`;
    });

    bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.toUpperCase() : '';

    if (text.startsWith('/') || text === '') return;

    const data = await getCurrencyData();
    if (!data) return;

    const currency = data.find(c => c.code === text);

    if (currency) {
        const message = ` **${currency.name}**\n\n rate: \`${currency.rate}\` ${currency.symbol}\n code: ${currency.code}`;
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, `Could not find "${text}" currency. Please use the menu buttons.`);
    }
});

console.log('Bot is running');