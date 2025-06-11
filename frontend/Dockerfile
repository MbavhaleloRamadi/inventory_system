FROM node:18

WORKDIR /app
COPY package.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
RUN npm install
COPY . .
RUN npm run build
