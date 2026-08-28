# Imagem base oficial do Node.js
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código fonte do Next.js
COPY . .

# Compila o projeto Next.js para produção
RUN npm run build

# Expõe a porta do Next.js
EXPOSE 3001

# Comando executado ao iniciar o container
CMD ["npm", "run", "start"]
