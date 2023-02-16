FROM node:16.15.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV RENDER_EXTERNAL_URL=$RENDER_EXTERNAL_URL

EXPOSE 5000
CMD [ "node", "index.js" ]