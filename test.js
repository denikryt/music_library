const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");


async function hasYtpErrorClass(page) {
  const selector = '.ytp-embed-error'; // Ваш селектор
  const result = await page.evaluate((selector) => {
    return !!document.querySelector(selector);
  }, selector);
  return result
}

async function getVideoTitleByEmbedUrl(page) {
  const xpath = '/html/body/div/div/div[3]/div[2]/div/a'; // Путь до элемента
  const titleText = await extractTextByXpath(page, xpath)
  return titleText
}

async function getPlaylistTitleByEmbedUrl(page) {
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

async function getImageByEmbedUrl(page) {
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

async function getAuthorByEmbedUrl(page) {
  const xpath = '/html/body/div/div/div[3]/div[1]/div[2]/div[1]/div[1]/a'; // Путь до элемента
  const authorText = await extractTextByXpath(page, xpath)
  return authorText
}

async function getDataByEmbedUrl(page, type) {
  const thumbnail = await getImageByEmbedUrl(page)
  
  let title = null

  if (type == 'video') {
    console.log('TYPE', type)
    title = await getVideoTitleByEmbedUrl(page)
  
  } else if (type == 'playlist') {
    console.log('TYPE', type)
    title = await getPlaylistTitleByEmbedUrl(page)
  
  }
  const author = await getAuthorByEmbedUrl(page)
  return {thumbnail, title, author}
}

async function extractVideoId(url) {
  const youtubeVideoLink =
  /^(http(s)?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]+)(\&[a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+)*(\?.*)?$/;
  const youtubePlaylistLink =
    /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)$/g;  

  const videoMatch = url.match(youtubeVideoLink);
  const playlistMatch = url.match(youtubePlaylistLink);

  if (videoMatch) {
    console.log(videoMatch)
    return videoMatch;
  } else if (playlistMatch) {
    console.log(playlistMatch)
    return playlistMatch;
  } else {
    return null;
  }
}

async function convertYoutubeUrlToEmbed(url){
  const youtubeLink =
  /^(http(s)?:\/\/)?(www\.)?((m\.)?youtube\.com|youtu\.be)\/.+$/;
  const youtubeVideoLink =
  /^(http(s)?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]+)(\&[a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+)*(\?.*)?$/;
  const youtubePlaylistLink =
    /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)$/;  

  console.log('[convertYoutubeUrlToEmbed] URL', url)

  if (youtubeLink.test(url)) {
    const result = await extractVideoId(url)
    console.log('[convertYoutubeUrlToEmbed] result', result)

    if (youtubeVideoLink.test(url)) {
      console.log('[convertYoutubeUrlToEmbed] It is a video!')
      const videoId = result[7];
      console.log('[convertYoutubeUrlToEmbed] videoId', videoId)

      embedURL = `https://www.youtube.com/embed/${videoId}`

    } else if (youtubePlaylistLink.test(url)) {
      console.log('[convertYoutubeUrlToEmbed] It is a playlist!')
      const playlistId = result[9];
      embedURL = `https://www.youtube.com/embed/videoseries?list=${playlistId}`;

    } else {
      return 'UNKNOWN LINK'
    }
  }
  // console.log('embedURL', embedURL)
  return embedURL
}

function convertToMaxRes(url) {
  const segments = url.split('/'); // Разбиваем ссылку на сегменты
  segments[segments.length - 1] = 'maxresdefault.jpg'; // Заменяем последний сегмент
  return segments.join('/'); // Собираем сегменты обратно в ссылку
}

async function brokenImageCheck(page, url) {
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

async function getDataByMetadata(page, url){
  const urlMetadata = `https://www.youtube.com/oembed?url=` + url + `&format=json`;
  const result = await page.goto(urlMetadata)

  if (result.ok()) {
    const jsonResponse = await result.json();

    const title = jsonResponse.title 
    const author = jsonResponse.author_name
    const metadataThumbnail = jsonResponse.thumbnail_url

    const convertedThumbnail = convertToMaxRes(metadataThumbnail)
    const brokenImage = await brokenImageCheck(page, convertedThumbnail)
    let thumbnail = ''

    if (brokenImage) {
      thumbnail = metadataThumbnail
    } else {
      thumbnail = convertedThumbnail
    }
    return {thumbnail, title, author}

  } else {
    console.log('Failed to fetch JSON data');
    return false
  }
}

async function getImageFromRawPage(page) {
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

async function getTitleFromRawPage(page) {
  const xpath = '/html/body/ytd-app/div[1]/ytd-page-manager/ytd-watch-flexy/div[5]/div[1]/div/div[2]/ytd-watch-metadata/div/div[1]/h1/yt-formatted-string'; // Путь до элемента
  const titleText = await extractTextByXpath(page, xpath)
  return titleText
}

async function getAuthorFromRawPage(page) {
  const xpath = '/html/body/ytd-app/div[1]/ytd-page-manager/ytd-watch-flexy/div[5]/div[1]/div/div[2]/ytd-watch-metadata/div/div[2]/div[1]/ytd-video-owner-renderer/div[1]/ytd-channel-name/div/div/yt-formatted-string/a'; // Путь до элемента
  const authorText = await extractTextByXpath(page, xpath)
  return authorText
}

async function getDataFromRawPage(page, url) {
  await page.goto(url);
  const thumbnail = await getImageFromRawPage(page)
  const title = await getTitleFromRawPage(page)
  const author = await getAuthorFromRawPage(page)
  return {thumbnail, title, author}
}

async function extractTextByXpath(page, xpath) {
  const text = await page.evaluate((xpath) => {
    const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (element) {
      return element.textContent.trim();
    }
    return null;
  }, xpath);
  return text
}

async function testFunc(page, url) {
  const embedURL = await convertYoutubeUrlToEmbed(url)
  console.log('[testFunc] EMBED URL', embedURL)
  await page.goto(embedURL);
  const EmbedError = await hasYtpErrorClass(page);

  const type = embedURL.length > 47 ? 'playlist' : 'video';

  if (EmbedError) {
    console.log('Embed url crahsed');
    data = await getDataByMetadata(page, url)
    data.author = type
    console.log(data)
    
    if (!data) {
      console.log('UNABLE TO EXTRACT DATA')
      return null
    }

  } else {
    console.log('Embed url works')
    data = await getDataByEmbedUrl(page, type)
    data.author = type
    console.log(data)
  }
}

(async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--headless"],
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36');
  page.setDefaultTimeout(0);
  page.setDefaultNavigationTimeout(0);

  const links = {
    videolinks : [
      "https://youtu.be/lh_WD_cLrRY?si=Xxw4B3PcBteb5mQh",
      "https://youtu.be/rIYnXgvRJVM?si=CaitzEtJ1rYJxoOo",
    ],

    playlistlinks : [
    "https://www.youtube.com/playlist?list=OLAK5uy_k6GaF0unR8JzhCPrvzjDuZrKig1QTWyj0",
    "https://youtube.com/playlist?list=OLAK5uy_kBVAk8lzaTTX1SyTolNzWyR_5uc55We84&si=iqnic8K7jSGsJGJA",
    ]
  }


  try {
    for (let key in links) {
      if (links.hasOwnProperty(key)) {
        console.log(`Свойство "${key}":`);
  
        // Итерация по каждому элементу массива, связанного с текущим свойством
        for (let index = 0; index < links[key].length; index++) {
          const link = links[key][index];
          console.log(`Элемент ${index + 1}: ${link}`);
          console.log('[main] LINK', link);
          console.log('HELLOOOOO');
          // const encodedUrl = encodeURI(link);
          // console.log('[main] encodedUrl', encodedUrl);
          // await extractVideoId(link);
          // await testFunc(page, encodedUrl);
        }
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    await browser.close();
  }
})();




// https://i.ytimg.com/vi/tLoWVqHjCnQ/maxresdefault.jpg
// https://i.ytimg.com/vi/tLoWVqHjCnQ/hqdefault.jpg


// scrapeData(url) {
//   const youtubeLink =
//     /^(http(s)?:\/\/)?(www\.)?((m\.)?youtube\.com|youtu\.be)\/.+$/;
//   const youtubeVideoLink =
//     /^(http(s)?:\/\/)?(www\.)?((m\.)?youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]+)$/;
//   const youtubePlaylistLink =
//     /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=/;

//   if (youtubeLink.test(url)) {
//     if (youtubeVideoLink.test(url)) {
//       const browser = await puppeteer.launch({
//         args: ["--no-sandbox", "--disable-setuid-sandbox", "--headless"],
//       });
//       const page = await browser.newPage();

//       try {
//         page.setDefaultTimeout(0);
//         page.setDefaultNavigationTimeout(0);
//         // Navigate to the YouTube page1
//         await page.goto(url);

//         // Scrape data from /html/head/link[28]
//         const linkElement = await page.$('link[rel="image_src"]');

//         // Extract the href attribute value from the <link> tag
//         const thumbnail = await linkElement.evaluate((element) =>
//           element.getAttribute("href")
//         );

//         console.log("Thumbnail", thumbnail);

//         // Scrape data from /html/head/title
//         const titleElement = await page.$('meta[name="title"]');
//         const titleText = await titleElement.getProperty("content");
//         const name = await titleText.jsonValue();

//         console.log("Video name:", name);

//         // Wait for the video player to be ready
//         await page.waitForSelector(
//           ".html5-video-player:not(.ad-showing) video"
//         );

//         // Get the duration text element
//         const durationElement = await page.$(
//           ".html5-video-player:not(.ad-showing) .ytp-time-duration"
//         );

//         // Extract the duration text and convert it to seconds
//         const durationText = await page.evaluate(
//           (element) => element.textContent,
//           durationElement
//         );

//         console.log(`The video is ${durationText} seconds long`);

//         // Parse the time in timeText into a Date object
//         const timeParts = durationText.split(":");
//         const time = new Date(0, 0, 0, 0, timeParts[0], timeParts[1]);

//         // Compare the time to 15:00
//         const cutoffTime = new Date(0, 0, 0, 15, 0);
//         const isTrack = time <= cutoffTime;

//         const type = isTrack ? "track" : "album";
//         console.log(type);

//         return { thumbnail, name, type };
//       } catch (error) {
//         console.log(error);
//       } finally {
//         await browser.close();
//       }
//     }

//     if (youtubePlaylistLink.test(url)) {
//       console.log(await youtube.metadata(url));
//       var name = (await youtube.metadata(url)).title;
//       var thumbnail = (await youtube.metadata(url)).thumbnail_url;
//       var type = "album";
//       return { thumbnail, name, type };
//     }
//   } else {
//     error("NOT A YOUTUBE LINK");
//   }
// }



// // const headers = {
// //   "User-Agent":
// //     "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0",
// // };

// // axios
// //   .get("https://www.youtube.com/watch?v=m35QbK_R4UI", { headers })
// //   .then((response) => {
// //     const $ = cheerio.load(response.data);
// //     console.log($);
// //     const duration = $(".ytp-time-duration").text();
// //     console.log(duration);
// //   })
// //   .catch((error) => {
// //     console.log(error);
// //   });
