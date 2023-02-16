const TelegramBot = require("node-telegram-bot-api");
const botListeners = require("./botListeners.js");
const ngrok = require("ngrok");

// const appURL = await ngrok.connect({
//   addr: process.env.PORT || 5000,
//   authtoken: "2AQMsLazUCSbrCi8ATjJWZMF5Wm_7haomK46oGei5EeBWb1wm", // if you have an ngrok account and want to use custom subdomains, provide your ngrok auth token here
// });

const botOptions = {
  webHook: true,
  polling: false,
};

class Bot {
  constructor() {
    // this.url = "https://denikryt-music-library.netlify.app";
    this.token = "5301226184:AAFeEf2yfBMjjBFEZgVEk9eSFQP4VilACUY";
    this.bot = new TelegramBot(this.token, botOptions);
    console.log("BOT", this.bot);
  }

  async start() {
    this.url = await ngrok.connect({
      addr: process.env.PORT || 5000,
      authtoken: "2AQMsLazUCSbrCi8ATjJWZMF5Wm_7haomK46oGei5EeBWb1wm", // if you have an ngrok account and want to use custom subdomains, provide your ngrok auth token here
    });
    await this.bot.setWebHook(`${this.url}/bot${this.token}`);
    console.log(`Webhook set up at ${this.url}`);
  }

  async listen() {
    botListeners(this.bot, this.url);
  }
}

const botClass = new Bot();
const bot = botClass.bot;

module.exports = {
  botClass,
  bot,
};
