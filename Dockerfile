FROM oven/bun:1.1-alpine

RUN apk add dumb-init --no-cache

RUN chown -R bun:bun /home/bun/app
USER bun
RUN mkdir -p /home/bun/app/node_modules
WORKDIR /home/bun/app

COPY ./package.json bun.lockb ./
RUN bun install --production --frozen-lockfile

COPY ./ ./

CMD [ "dumb-init","bun","run","prod" ]

EXPOSE 3000