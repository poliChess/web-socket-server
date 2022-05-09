FROM node:17.8.0-alpine as base

RUN mkdir -p /app
WORKDIR /app

COPY . .

EXPOSE 3000
EXPOSE 8080

RUN npm install
RUN npm run build

CMD ["npm", "run", "start"]
