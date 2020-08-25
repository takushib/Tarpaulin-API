FROM node:latest
WORKDIR /usr/src/app
COPY . .
RUN npm install nodemon -g
ENV NODE_ENV development
EXPOSE ${PORT}
CMD [ "nodemon", "server.js" ]
