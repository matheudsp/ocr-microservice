FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json ./


RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
RUN npm install --only=production

RUN apk add --no-cache openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/infra/config/prisma ./src/infra/config/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma


EXPOSE 3000

# Comando de inicialização
CMD ["node", "dist/main.js"]