FROM node:22-alpine AS base
WORKDIR /usr/src/app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY . .

CMD ["npm", "start"]
