FROM ghcr.io/puppeteer/puppeteer:24.11.2

WORKDIR /app

USER root
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN chown -R pptruser:pptruser /app
USER pptruser

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]
