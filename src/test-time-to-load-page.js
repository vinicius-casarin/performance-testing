const puppeteer = require("puppeteer");
const { LOGS_PATH, CUSTOM_UA, TIMEOUT } = require("./constants");

const iPhone = puppeteer.KnownDevices["iPhone 12"];

async function getPerformanceTime(page) {
  return JSON.parse(
    await page.evaluate(() => {
      const [timing] = performance.getEntriesByType("navigation");
      return JSON.stringify({
        format: timing ? "PerformanceNavigationTiming" : "PerformanceTiming",
        data: timing || window.performance.timing,
      });
    })
  );
}

async function loadPage(pageSetup, deviceName, pageURL, title, index) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.setDefaultTimeout(TIMEOUT);

  const pageReady = await pageSetup(page);
  await pageReady.tracing.start({
    path: `${LOGS_PATH}/${title}-${deviceName}-${index}.json`,
    screenshots: true,
  });

  try {
    await pageReady.goto(pageURL);
    const times = await getPerformanceTime(pageReady);
    console.log(
      `${index};${deviceName};${pageURL};${parseInt(
        times.data.redirectEnd
      )};${parseInt(times.data.requestStart)};${parseInt(
        times.data.responseEnd
      )};${parseInt(times.data.loadEventEnd)}`
    );
  } catch (error) {
    console.log(
      `${index};${deviceName};${pageURL};timeout;timeout;timeout;timeout`
    );
  } finally {
    await pageReady.tracing.stop();
    await browser.close();

    delete browser;
    delete page;
    delete pageReady;
    delete times;
  }

  // return {
  //   redirectEnd: times.data.redirectEnd,
  //   requestStart: times.data.requestStart,
  //   responseEnd: times.data.responseEnd,
  //   loadEventEnd: times.data.loadEventEnd,
  // }
}

async function desktopLarge(page) {
  await page.setUserAgent(CUSTOM_UA);
  await page.setViewport({
    width: 1792,
    height: 999,
  });
  return page;
}

async function mobileIphone(page) {
  await page.emulate(iPhone);
  return page;
}

(async () => {
  const sampling = 1000;
  const pages = [
    {
      url: "https://stg.kabum.com.br",
      title: "kabum_home",
    },
  ];

  for (let index = 1; index <= sampling; index++) {
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];

      try {
        await loadPage(desktopLarge, "desktop", page.url, page.title, index);
        await loadPage(mobileIphone, "iphone", page.url, page.title, index);
      } catch (error) {
        console.log("erro");
      }
    }
  }

  console.log(`end;end;end;end;end;end;end`);
})();
