FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --silent

COPY --chown=node:node src ./src

ENV NODE_ENV=production
EXPOSE 3000

USER node
CMD ["node", "src/server.js"]
