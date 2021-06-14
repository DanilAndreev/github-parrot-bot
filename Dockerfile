FROM node:12-alpine AS build
MAINTAINER "(C) Danil Andreev | danssg08@gmail.com | https://github.com/DanilAndreev"

# Install dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn --frozen-lockfile install

# Build project
COPY . .
RUN npm run build:compile
RUN npm run build:copyfiles

FROM node:12-alpine
ENV PORT $PORT

RUN mkdir /dest
COPY --from=build dest/ dest/
COPY --from=build LICENSE /
COPY --from=build package.json /
COPY --from=build yarn.lock /
COPY --from=build README.md /
WORKDIR /

# Installing production version of node modules
RUN yarn --frozen-lockfile install --production
# Expose ports
EXPOSE $PORT


CMD ["node", "/dest/index.js"]
