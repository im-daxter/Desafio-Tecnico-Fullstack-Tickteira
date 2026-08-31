FROM node:20-alpine AS builder

# Instala OpenSSL necessário para o Prisma em imagens Alpine
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
