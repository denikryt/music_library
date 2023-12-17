const fs = require('fs'); // Модуль для работы с файловой системой
const scraper = require("./youtubeScraperTest.js");

// Загрузка данных из файла result.json
const rawData = fs.readFileSync('result.json');
const data = JSON.parse(rawData);
const fileName = 'output.txt';

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

const failed_links = []
let ok

async function main(){
  await scraper.runBrowser()
  // Вывод ID сообщений и соответствующих ссылок (или пустых строк)
  // console.log('ID сообщения : Ссылка');
  for (const messageId in idLinkMap) {
    console.log(`---------------\n${messageId.padEnd(5)}: ${idLinkMap[messageId]}`);
    ok = await scraper.scrapeData(idLinkMap[messageId])
    
    if (!ok) {
      console.log('FAILED')
      failed_links.push(idLinkMap[messageId])
    }
  }
  writeToFile(failed_links, 'output.txt')
  await scraper.browser.close()
}

// Функция для записи данных в файл
function writeToFile(array, filename) {
  const dataToWrite = array.join('\n'); // Объединяем элементы массива в строку с переносом строки между элементами

  fs.writeFile(filename, dataToWrite, err => {
    if (err) {
      console.error('Произошла ошибка при записи в файл:', err);
    } else {
      console.log(`Данные успешно записаны в файл '${filename}'.`);
    }
  });
}

main()