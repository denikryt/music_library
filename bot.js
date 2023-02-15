const TelegramBot = require("node-telegram-bot-api");
const botListeners = require("./botListeners.js");

const token = "5301226184:AAFeEf2yfBMjjBFEZgVEk9eSFQP4VilACUY";

class Bot {
  constructor() {
    this.bot = new TelegramBot(token, { polling: true });
  }

  start() {
    botListeners(this.bot);
  }
}

module.exports = new Bot();
