FROM node:10
WORKDIR /usr/src/vacuum-controller
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080

ENTRYPOINT [ "node", "index.js" ]