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
const succeeded_links = []
const tracks = []
let ok

async function main(){
  await scraper.runBrowser()
  // Вывод ID сообщений и соответствующих ссылок (или пустых строк)
  // console.log('ID сообщения : Ссылка');
  for (const messageId in idLinkMap) {
    console.log(`---------------\n${messageId.padEnd(5)}: ${idLinkMap[messageId]}`);
    trackInfo = await scraper.scrapeData(idLinkMap[messageId])
    
    if (!trackInfo) {
      console.log('FAILED')
      failed_links.push(idLinkMap[messageId])
    } else {
      succeeded_links.push(idLinkMap[messageId])
      tracks.push(trackInfo)
      // writeToJSON(tracks)
    }
  }
  writeToFile(failed_links, 'failed links.txt')
  writeToFile(succeeded_links, 'succeeded links.txt')
  writeToJSON(tracks)
  await scraper.browser.close()
}

function writeToJSON(data){
    // Преобразование массива объектов в JSON
  const jsonData = JSON.stringify(data, null, 2); // Красивое форматирование JSON с отступами 2

  // Запись JSON данных в файл
  const filePath = 'tracks.json'; // Путь к файлу, куда нужно сохранить JSON данные

  fs.writeFile(filePath, jsonData, 'utf8', (err) => {
    if (err) {
      console.error('Ошибка записи файла:', err);
      return;
    }
    console.log('Данные успешно сохранены в файле:', filePath);
  });
}

// Функция для записи данных в файл
function writeToFile(array, filename) {
  const dataToWrite = array.join('\n'); // Объединяем элементы массива в строку с переносом строки между элементами

  fs.writeFile(filename, dataToWrite, { flag: 'w' }, err => {
    if (err) {
      console.error('Произошла ошибка при записи в файл:', err);
    } else {
      console.log(`Данные успешно записаны в файл '${filename}'.`);
    }
  });
  };

main()