const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");


class YoutubeScraper {
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

    if (type == 'video') {
      console.log('TYPE', type)
      name = await this.getVideoTitleByEmbedUrl(page)
    
    } else if (type == 'playlist') {
      console.log('TYPE', type)
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

  async convertYoutubeUrlToEmbed(url){
    const youtubeLink =
    /^(http(s)?:\/\/)?(www\.)?((m\.)?youtube\.com|youtu\.be)\/.+$/;
    const youtubeVideoLink =
    /^(http(s)?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]+)(\&[a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+)*(\?.*)?$/;
    const youtubePlaylistLink =
    /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)$/;  

    let embedURL = ''

    if (youtubeLink.test(url)) {
      const result = await this.extractVideoId(url)
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
    // console.log('embedURL', embedURL)
    return embedURL
  }

  async convertToMaxRes(url) {
    const segments = url.split('/'); // Разбиваем ссылку на сегменты
    segments[segments.length - 1] = 'maxresdefault.jpg'; // Заменяем последний сегмент
    return segments.join('/'); // Собираем сегменты обратно в ссылку
  }

  async brokenImageCheck(page, url) {
    console.log('URL', url)
    await page.goto(url);

    const isSmallImage = await page.evaluate(() => {
      const titleElement = document.querySelector('title');
      const titleText = titleElement.textContent;

      return titleText.includes('(120×90)');
    });

    if (isSmallImage) {
      console.log(`${url}: Это маленькое изображение`);
      return true
    } else {
      console.log(`${url}: Это большое изображение`);
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

  async scrapeData(url) {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--headless"],
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36');
    page.setDefaultTimeout(0);
    page.setDefaultNavigationTimeout(0);

    const embedURL = await this.convertYoutubeUrlToEmbed(url)

    try {
      await page.goto(embedURL);
      const EmbedError = await this.hasYtpErrorClass(page);

      const type = embedURL.length > 47 ? 'playlist' : 'video';
      let data = {}

      if (EmbedError) {
        console.log('Embed url crahsed');
        data = await this.getDataByMetadata(page, url)
        data.type = type
        console.log(data)
        
        if (!data) {
          console.log('UNABLE TO EXTRACT DATA')
          return null
        }

      } else {
        console.log('Embed url works')
        data = await this.getDataByEmbedUrl(page, type)
        data.type = type
        console.log(data)
      }
      return data

    } catch (error) {
      console.log(error);
    } finally {
      await browser.close();
    }
  }
}

module.exports = new YoutubeScraper();

// (async () => {
//   const url = "https://www.youtube.com/playlist?list=OLAK5uy_nmB6K5bRhNjLku0XHRXFsiqbrVtXCFOaM"
//   await scrapeData(url)
// })()
