FROM denoland/deno:1.29.2

EXPOSE 8080
EXPOSE 443

WORKDIR /app

COPY server.ts ./server.ts

USER deno

CMD ["run", "--unstable", "--allow-all", "server.ts"]