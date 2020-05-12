FROM node:14-alpine

ADD . /src/
WORKDIR /src
RUN yarn
RUN ./node_modules/next/dist/bin/next build

ENV NODE_ENV=production

CMD node src/server.js
