FROM node:16 AS build

WORKDIR /app

# add cache
# git wants work tree
COPY . .

RUN npm install

FROM debian:buster-slim

WORKDIR /app

RUN apt-get -y update

RUN apt-get -y install curl

RUN curl -fsSL https://deb.nodesource.com/setup_16.x |  bash -

RUN apt-get install -y nodejs

COPY --from=build /app .

CMD [ "node", "."]
