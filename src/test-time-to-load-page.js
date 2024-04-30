const fs = require('fs')
const puppeteer = require('puppeteer')
const { LOGS_PATH, CUSTOM_UA, TIMEOUT } = require('./constants')
const lighthouse = (...args) =>
  import('lighthouse').then(({ default: lighthouse }) => lighthouse(...args))

const iPhone = puppeteer.KnownDevices['iPhone 12']

async function getPerformanceTime(page) {
  return JSON.parse(
    await page.evaluate(() => {
      const [timing] = performance.getEntriesByType('navigation')
      return JSON.stringify({
        format: timing ? 'PerformanceNavigationTiming' : 'PerformanceTiming',
        data: timing || window.performance.timing,
      })
    })
  )
}

async function loadPage(
  pageSetup,
  deviceName,
  pageURL,
  title,
  index,
  folderName
) {
  const filePath = `${LOGS_PATH}/${folderName}/${title}-${deviceName}-${index}`
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  page.setDefaultTimeout(TIMEOUT)

  const pageReady = await pageSetup(page)

  await lighthouseAudit(pageURL, pageReady, filePath)
  await pageReady.tracing.start({
    path: `${filePath}.json`,
    screenshots: true,
  })

  try {
    await pageReady.goto(pageURL)
    const times = await getPerformanceTime(pageReady)
    console.log(
      `${index};${deviceName};${pageURL};${parseInt(
        times.data.redirectEnd
      )};${parseInt(times.data.requestStart)};${parseInt(
        times.data.responseEnd
      )};${parseInt(times.data.loadEventEnd)}`
    )
  } catch (error) {
    console.log(
      `${index};${deviceName};${pageURL};timeout;timeout;timeout;timeout`
    )
  } finally {
    await pageReady.tracing.stop()
    await browser.close()

    delete browser
    delete page
    delete pageReady
    delete times
  }

  // return {
  //   redirectEnd: times.data.redirectEnd,
  //   requestStart: times.data.requestStart,
  //   responseEnd: times.data.responseEnd,
  //   loadEventEnd: times.data.loadEventEnd,
  // }
}

async function lighthouseAudit(pageURL, pageReady, filePath) {
  const lighthouseRunner = await lighthouse(
    pageURL,
    {
      output: 'html',
    },
    undefined,
    pageReady
  )

  fs.writeFileSync(
    `${filePath}-notas.json`,
    Object.values(lighthouseRunner.lhr.categories)
      .map((c) => c.score)
      .join(', ')
  )
  fs.writeFileSync(`${filePath}.html`, lighthouseRunner.report)
}

async function desktopLarge(page) {
  await page.setUserAgent(CUSTOM_UA)
  await page.setViewport({
    width: 1792,
    height: 999,
  })
  return page
}

async function mobileIphone(page) {
  await page.emulate(iPhone)
  return page
}

;(async () => {
  const sampling = 1
  const pages = [
    {
      url: 'https://stg.kabum.com.br',
      title: 'kabum_home',
    },
  ]
  const folderName = new Date().getTime()
  fs.mkdirSync(`${LOGS_PATH}/${folderName}`)

  for (let index = 1; index <= sampling; index++) {
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex]

      try {
        await loadPage(
          desktopLarge,
          'desktop',
          page.url,
          page.title,
          index,
          folderName
        )
        await loadPage(
          mobileIphone,
          'iphone',
          page.url,
          page.title,
          index,
          folderName
        )
      } catch (error) {
        console.log('erro', error)
      }
    }
  }

  console.log(`end;end;end;end;end;end;end`)
})()
