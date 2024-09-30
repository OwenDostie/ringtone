FROM denoland/deno:alpine

WORKDIR /app

# COPY . /app

# EXPOSE 80

CMD ["deno", "task", "start"]
