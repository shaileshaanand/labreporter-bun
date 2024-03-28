FROM oven/bun:slim
ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y curl dumb-init && \
    curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | bash -s 20 && \
    apt purge -y curl && \
    apt autoremove -y && \
    rm -rf /var/lib/apt/lists/*

RUN chown -R bun:bun /home/bun/app
USER bun
RUN mkdir -p /home/bun/app/node_modules
WORKDIR /home/bun/app

COPY ./package.json ./
RUN bun install

COPY ./ ./

CMD [ "dumb-init","bun","run","prod" ]

EXPOSE 3000