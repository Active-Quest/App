FROM node:18
WORKDIR /app

# Only copy contents of mqtt-logger/ (now includes models)
COPY . .

RUN npm install

CMD ["node", "mqtt-logger.js"]
