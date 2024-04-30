const fs = require('fs');

// const { LOGS_PATH, SCREENSHOT_PATH } = require('./constants');
const LOGS_PATH = `${__dirname}/../output/logs`;
const SCREENSHOT_PATH = `${__dirname}/../output/screenshot`;

(async () => {
  const files = fs.readdirSync(LOGS_PATH);

  files.map((file) => {
    const [fileName] = file.split('.');

    const tracing = JSON.parse(fs.readFileSync(`${LOGS_PATH}/${file}`, 'utf8'));

    const traceScreenshots = tracing.traceEvents.filter(x => (
      x.cat === 'disabled-by-default-devtools.screenshot' &&
      x.name === 'Screenshot' &&
      typeof x.args !== 'undefined' &&
      typeof x.args.snapshot !== 'undefined'
    ));

    traceScreenshots.forEach(function(snap, index) {
      fs.writeFile(`${SCREENSHOT_PATH}/${fileName}-${index}.png`, snap.args.snapshot, 'base64', function(err) {
        if (err) {
          console.log('writeFile error', err);
        }
      });
    });
  });
})();