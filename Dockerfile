FROM node:12-alpine AS build
MAINTAINER "(C) Danil Andreev | danssg08@gmail.com | https://github.com/DanilAndreev"

# Install dependencies
COPY package.json .
RUN npm install

# Build project
COPY . .
RUN npm run build

FROM node:12-alpine
ENV PORT $PORT

RUN mkdir /dest
COPY --from=build dest/ dest/
COPY --from=build LICENSE /
COPY --from=build package.json /
COPY --from=build README.md /
WORKDIR /

# Installing production version of node modules
RUN npm install --production
# Expose ports
EXPOSE $PORT


CMD ["node", "/dest/index.js"]
