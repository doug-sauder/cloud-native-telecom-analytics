FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci --production --silent

COPY src ./src

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node","src/server.js"]
