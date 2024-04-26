const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

class YoutubeScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async hasYtpErrorClass(page) {
    const selector = '.ytp-embed-error'; // Ваш селектор
    const result = await page.evaluate((selector) => {
      return !!document.querySelector(selector);
    }, selector);
    return result
  }

  async getVideoTitleByEmbedUrl(page) {
    const xpath = '/html/body/div/div/div[3]/div[2]/div/a'; // Путь до элемента
    const titleText = await this.extractTextByXpath(page, xpath)
    return titleText
  }

  async getPlaylistTitleByEmbedUrl(page) {
    const xpath = '/html/body/div/div/div[3]/div[4]/button[5]'; // Путь до элемента
    const elementText = await page.evaluate((xpath) => {
    const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element) {
        return element.getAttribute('title'); // Получаем значение атрибута title
      }
      return null;
    }, xpath);

    const regex = /"([^"]+)"/;
    const match = elementText.match(regex);

    if (match && match[1]) {
      const extractedText = match[1];
      return extractedText
    } else {
      console.log('No match found in getPlaylistTitleByEmbedUrl');
      return null
    }
  }

  async getImageByEmbedUrl(page) {
    const result = await page.evaluate(() => {
      const element = document.querySelector('.ytp-cued-thumbnail-overlay-image');
      if (element) {
        const style = window.getComputedStyle(element);
        const backgroundImage = style.getPropertyValue('background-image');
        const urlMatch = backgroundImage.match(/url\("(.+)"\)/);
        if (urlMatch) {
          return urlMatch[1];
        }
      }
      return null;
    });
    return result;
  }

  async getAuthorByEmbedUrl(page) {
    const xpath = '/html/body/div/div/div[3]/div[1]/div[2]/div[1]/div[1]/a'; // Путь до элемента
    const authorText = await this.extractTextByXpath(page, xpath)
    return authorText
  }

  async getDataByEmbedUrl(page, type) {
    const thumbnail = await this.getImageByEmbedUrl(page)
    
    let name = null

    if (type == 'track') {
      console.log('[getDataByEmbedUrl] TYPE', type)
      name = await this.getVideoTitleByEmbedUrl(page)
    
    } else if (type == 'album') {
      console.log('[getDataByEmbedUrl] TYPE', type)
      name = await this.getPlaylistTitleByEmbedUrl(page)
    
    }
    const author = await this.getAuthorByEmbedUrl(page)
    return {thumbnail, name, author}
  }

  async extractVideoId(url) {
    const youtubeVideoLink =
    /^(http(s)?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]+)(\&[a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+)*(\?.*)?$/;
    const youtubePlaylistLink =
    /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)$/;  

    const videoMatch = url.match(youtubeVideoLink);
    const playlistMatch = url.match(youtubePlaylistLink);

    if (videoMatch) {
      return videoMatch;
    } else if (playlistMatch) {
      return playlistMatch;
    } else {
      return null;
    }
  }

  extractVideoId(url) {
    const videoIdRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(videoIdRegex);
    // console.log('[extractVideoId] match: ', match)
    return match ? match[1] : null;
  }
  
  extractPlaylistId(url) {
    const playlistIdRegex = /[?&]list=([^&]+)/;
    const match = url.match(playlistIdRegex);
    // console.log('[extractPlaylistId] match: ', match)
    return match ? match[1] : null;
  }

  async convertYoutubeUrlToEmbed(url) {
    const youtubeVideoLink =
        /^(http(s)?:\/\/)?(www\.)?(m\.youtube\.com|youtube\.com)\/watch\?([^#\s]*)?(#[^\s]*)?$/;
    const youtubeVideoShortLink = /^(http(s)?:\/\/)?(www\.)?youtu\.be\/([a-zA-Z0-9_-]+)(\?[^#\s]*)?(#[^\s]*)?$/;
    const youtubePlaylistLink =
        /^(https?:\/\/)?(www\.)?(youtube\.com)\/playlist\?list=([a-zA-Z0-9_-]+)(\&[a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+)*$/;

    let embedURL = '';
  
    if (youtubeVideoLink.test(url)) {
      const videoId = this.extractVideoId(url);
      embedURL = `https://www.youtube.com/embed/${videoId}`;
    } else if (youtubeVideoShortLink.test(url)) {
      const videoId = this.extractVideoId(url);
      embedURL = `https://www.youtube.com/embed/${videoId}`;
    } else if (youtubePlaylistLink.test(url)) {
      const playlistId = this.extractPlaylistId(url);
      embedURL = `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    } else {
      return false;
    }
  
    return embedURL;
  }

  async convertYoutubeUrlToEmbed_old(url){
    const youtubeLink =
    /^(http(s)?:\/\/)?(www\.)?((m\.)?youtube\.com|youtu\.be)\/.+$/;
    const youtubeVideoLink =
    /^(http(s)?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]+)(\&[a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+)*(\?.*)?$/;
    const youtubePlaylistLink =
    /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)$/;  

    let embedURL = ''

    if (youtubeLink.test(url)) {
      const result = await this.extractVideoId(url)
      console.log('[convertYoutubeUrlToEmbed] result: ', result)
      if (youtubeVideoLink.test(url)) {
        const videoId = result[7];
        embedURL = `https://www.youtube.com/embed/${videoId}`

      } else if (youtubePlaylistLink.test(url)) {
        const playlistId = result[3];
        embedURL = `https://www.youtube.com/embed/videoseries?list=${playlistId}`;

      } else {
        return 'UNKNOWN LINK'
      }
    }
    return embedURL
  }

  async convertToMaxRes(url) {
    const segments = url.split('/'); // Разбиваем ссылку на сегменты
    segments[segments.length - 1] = 'maxresdefault.jpg'; // Заменяем последний сегмент
    return segments.join('/'); // Собираем сегменты обратно в ссылку
  }

  async brokenImageCheck(page, url) {
    // console.log('URL', url)
    await page.goto(url);

    const isSmallImage = await page.evaluate(() => {
      const titleElement = document.querySelector('title');
      const titleText = titleElement.textContent;

      return titleText.includes('(120×90)');
    });

    if (isSmallImage) {
      console.log(`[brokenImageCheck] ${url}: Это маленькое изображение`);
      return true
    } else {
      console.log(`[brokenImageCheck] ${url}: Это большое изображение`);
      return false
    }
  }

  async getDataByMetadata(page, url){
    const urlMetadata = `https://www.youtube.com/oembed?url=` + url + `&format=json`;
    const result = await page.goto(urlMetadata)

    if (result.ok()) {
      const jsonResponse = await result.json();

      const name = jsonResponse.title 
      const author = jsonResponse.author_name
      const metadataThumbnail = jsonResponse.thumbnail_url

      const convertedThumbnail = await this.convertToMaxRes(metadataThumbnail)
      const brokenImage = await this.brokenImageCheck(page, convertedThumbnail)
      let thumbnail = ''

      if (brokenImage) {
        thumbnail = metadataThumbnail
      } else {
        thumbnail = convertedThumbnail
      }
      return {thumbnail, name, author}

    } else {
      console.log('Failed to fetch JSON data');
      return false
    }
  }

  async getImageFromRawPage(page) {
    const xpath = '/html/body/ytd-app/div[1]/ytd-page-manager/ytd-watch-flexy/div[5]/div[1]/div/div[1]/div[2]/div/div/ytd-player/div/div/div[4]/div'; // Путь до элемента
    const backgroundImageStyle = await page.evaluate((xpath) => {
      const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element) {
        return element.style.backgroundImage;
      }
      return null;
    }, xpath);

    const imageUrl = backgroundImageStyle.match(/url\("([^"]*)"\)/)[1]; // Извлекаем URL из атрибута style
    // console.log('Image URL:', imageUrl);
    return imageUrl
  }

  async getTitleFromRawPage(page) {
    const xpath = '/html/body/ytd-app/div[1]/ytd-page-manager/ytd-watch-flexy/div[5]/div[1]/div/div[2]/ytd-watch-metadata/div/div[1]/h1/yt-formatted-string'; // Путь до элемента
    const titleText = await this.extractTextByXpath(page, xpath)
    return titleText
  }

  async getAuthorFromRawPage(page) {
    const xpath = '/html/body/ytd-app/div[1]/ytd-page-manager/ytd-watch-flexy/div[5]/div[1]/div/div[2]/ytd-watch-metadata/div/div[2]/div[1]/ytd-video-owner-renderer/div[1]/ytd-channel-name/div/div/yt-formatted-string/a'; // Путь до элемента
    const authorText = await this.extractTextByXpath(page, xpath)
    return authorText
  }

  async getDataFromRawPage(page, url) {
    await page.goto(url);
    const thumbnail = await this.getImageFromRawPage(page)
    const title = await this.getTitleFromRawPage(page)
    const author = await this.getAuthorFromRawPage(page)
    return {thumbnail, title, author}
  }

  async extractTextByXpath(page, xpath) {
    const text = await page.evaluate((xpath) => {
      const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element) {
        return element.textContent.trim();
      }
      return null;
    }, xpath);
    return text
  }

  async runBrowser() {
    this.browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--headless"],
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36');
    this.page.setDefaultTimeout(0);
    this.page.setDefaultNavigationTimeout(0);
  }

  async processLinks(links) {
    await this.runBrowser();

    try {
      for (let key in links) {
        if (links.hasOwnProperty(key)) {
          console.log(`----- Свойство "${key}":`);
  
          for (let index = 0; index < links[key].length; index++) {
            const url = links[key][index];
            console.log(`Элемент ${index + 1}: ${url}`);
  
            try {
              await scraper.scrapeData(url);
              console.log('--------------')
            } catch (error) {
              console.log('Error while scraping data:', error);
            }
  
            // Добавление паузы на 3 секунды перед следующей итерацией
            if (index < links[key].length - 1) {
              await new Promise(resolve => setTimeout(resolve, 3000)); // пауза на 3 секунды (3000 миллисекунд)
            }
          }
        }
      }
    } catch (error) {
      console.log('Error during scraping:', error);
    } finally {
      // Закрыть браузер только после завершения всех операций скрапинга
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async scrapeData(url) {
    const embedURL = await this.convertYoutubeUrlToEmbed(url)
    console.log('[scrapeData] EMBED URL: ',embedURL)

    if (embedURL == false) {
      return false

    } else {
      try {
        await this.page.goto(embedURL);
        const EmbedError = await this.hasYtpErrorClass(this.page);

        const type = embedURL.length > 47 ? 'album' : 'track';
        let data = {}

        if (EmbedError) {
          console.log('[scrapeData] Embed url crahsed');
          data = await this.getDataByMetadata(this.page, url)
          data.type = type
          data.url = url
          console.log('[scrapeData] DATA: ', data)
          
          if (!data) {
            console.log('UNABLE TO EXTRACT DATA')
            return null
          }

        } else {
          console.log('[scrapeData] Embed url works')
          data = await this.getDataByEmbedUrl(this.page, type)
          data.type = type
          data.url = url
          console.log('[scrapeData] DATA: ', data)
        }
        return data

      } catch (error) {
        console.log(error);
      }
    }
  }

}

module.exports = new YoutubeScraper();

// const scraper = new YoutubeScraper()

// const links = {
//   videolinks: [
//     "https://youtu.be/FH7QW2zWIko?si=ugMXUunRqNSrpd4G",
//     "https://youtu.be/xzh1HcmUcHs?si=mOTecDLyXjaJ6FZ6"
//   ],
//   playlistlinks: [
//   ]
// }

// scraper.processLinks(links);
