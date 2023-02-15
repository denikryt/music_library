const axios = require("axios");
const Controller = require("./controller.js");
const { Keyboard, Key } = require("telegram-keyboard");

const botListeners = (bot) => {
  bot.on("message", async (message) => {
    // handle message event
    bot.sendMessage(183278535, `@${message.from.username}\n${message.text}`);
  });

  bot.on("channel_post", async (channelPost) => {
    // handle channel post event
    let message = channelPost;
    let messageText = message.text;
    const myID = 183278535;
    const myChannelID = -1001830200744;

    const youtubeLink = /^(https?:\/\/)?(www\.)?(youtube\.com\/|youtu\.be\/)/;

    let text;

    if (channelPost.chat.id === myChannelID) {
      if (youtubeLink.test(messageText)) {
        const track = await postNewTrack(messageText);
        if (track) {
          const inlineKeyboard = {
            inline_keyboard: [[{ text: "ССылка", url: `${track.url}` }]],
          };
          text = `Загружено!\n${track.name}\n${track.thumbnail}`;

          bot.sendMessage(183278535, text, {
            reply_markup: inlineKeyboard,
          });
        } else {
          text = `Не получилось загрузить!\n${messageText}}`;
          bot.sendMessage(183278535, text);
        }
      } else {
        text = `Я понимаю только ссылки с ютуба!`;
        bot.sendMessage(183278535, text);
      }
    }
  });
};

async function postNewTrack(url) {
  try {
    const response = await axios.post(
      `http://localhost:5000/add/${encodeURIComponent(url)}`
    );
    console.log("responseDATA", response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return false;
  }
}

module.exports = botListeners;
