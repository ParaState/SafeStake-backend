FROM node:14

WORKDIR /safestake-server
COPY package.json .
RUN npm install
COPY . .
CMD node index.js
