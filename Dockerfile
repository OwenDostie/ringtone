FROM debian:latest as base

COPY --from=denoland/deno:bin-1.45.5 /deno /usr/local/bin/deno

FROM base AS final

WORKDIR /app

COPY . .

EXPOSE 80

# CMD ["deno", "--version"]