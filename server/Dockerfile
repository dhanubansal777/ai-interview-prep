FROM ghcr.io/puppeteer/puppeteer:24.11.2

WORKDIR /app

USER root
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN chown -R pptruser:pptruser /app
USER pptruser

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]
