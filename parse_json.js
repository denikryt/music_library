const fs = require('fs'); // Модуль для работы с файловой системой

// Загрузка данных из файла result.json
const rawData = fs.readFileSync('result.json');
const data = JSON.parse(rawData);

// Функция для извлечения ссылок из сообщений и их ассоциации с ID
function mapMessageLinks(messages) {
  const idLinkMap = {};

  messages.forEach(message => {
    let link = '';
    if (message.text) {
      if (Array.isArray(message.text)) {
        message.text.forEach(textElement => {
          if (textElement.type === 'link') {
            link = textElement.text;
          }
        });
      } else if (message.text.type === 'link') {
        link = message.text.text;
      }
    }
    idLinkMap[message.id.toString()] = link;
  });

  return idLinkMap;
}

// Получение соответствий ID сообщений и ссылок (если они есть)
const messages = data.messages || [];
const idLinkMap = mapMessageLinks(messages);

// Вывод ID сообщений и соответствующих ссылок (или пустых строк)
console.log('ID сообщения : Ссылка');
for (const messageId in idLinkMap) {
  console.log(`${messageId.padEnd(14)}: ${idLinkMap[messageId]}`);
}
