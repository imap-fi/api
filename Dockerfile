FROM node:16 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

FROM debian:buster-slim

SHELL ["/bin/bash", "--login", "-c"]

WORKDIR /app

RUN apt-get -y update

RUN apt-get -y install curl

RUN curl -fsSL https://deb.nodesource.com/setup_16.x |  bash -

RUN apt-get install -y nodejs

COPY --from=build /app .

# add caching
COPY . .

CMD [ "node", "."]