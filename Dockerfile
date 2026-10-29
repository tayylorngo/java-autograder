FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-17-jdk-headless && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server.js tests.json grader.policy ./
COPY public ./public
# run student code as an unprivileged user; /app stays writable for state.json and submissions.jsonl
RUN useradd -m grader && chown -R grader /app
USER grader
ENV PORT=8080 LANG=C.UTF-8
EXPOSE 8080
CMD ["node", "server.js"]
