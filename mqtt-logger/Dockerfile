FROM node:18
WORKDIR /app

# Copy both the mqtt-logger and model code
COPY mqtt-logger/. .
COPY backend/models ./backend/models

RUN npm install

CMD ["node", "mqtt-logger.js"]
