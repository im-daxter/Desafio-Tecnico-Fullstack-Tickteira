# Imagem base oficial do Node.js
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia a pasta do Prisma para gerar o Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copia o restante do código fonte
COPY . .

# Compila o projeto NestJS (gera a pasta /dist)
RUN npm run build

# Expõe a porta que o NestJS vai rodar
EXPOSE 3000

# Comando executado ao iniciar o container
CMD ["npm", "run", "start:prod"]
