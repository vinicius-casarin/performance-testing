FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /code

COPY . .

CMD node ./src/test-time-to-load-page.js > /code/output/output.csv
