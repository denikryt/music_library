const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    const urls = [
      'https://i.ytimg.com/vi/mZkJsMleF6Y/maxresdefault.jpg', // Замените на ссылку первой страницы
      'https://i.ytimg.com/vi_webp/zB-ZUcLoI10/maxresdefault.webp'  // Замените на ссылку второй страницы
    ];

    for (const url of urls) {
      await page.goto(url);

      const isBigImage = await page.evaluate(() => {
        const titleElement = document.querySelector('title');
        const titleText = titleElement.textContent;

        return titleText.includes('(120×90)');
      });

      if (!isBigImage) {
        console.log(`${url}: Это большое изображение`);
      } else {
        console.log(`${url}: Это маленькое изображение`);
      }
    }

    await browser.close();
  } catch (error) {
    console.error('An error occurred:', error);
    await browser.close();
  }
})();
