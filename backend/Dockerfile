FROM node:20-slim

# Hugging Face Spaces runs containers as uid 1000. node:20-slim already ships a
# "node" user at that uid, so reuse it — adding a second user with the same uid
# fails the build.
USER node
ENV HOME=/home/node PATH=/home/node/.local/bin:$PATH
WORKDIR $HOME/app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

ENV NODE_ENV=production PORT=7860 HOST=0.0.0.0
EXPOSE 7860

# /data exists only at runtime and only when a storage bucket is attached, so
# fall back to the ephemeral directory when it is absent. exec keeps node as
# PID 1 so it receives shutdown signals.
CMD ["sh","-c","if mkdir -p /data/uploads 2>/dev/null; then ln -sfn /data/uploads uploads; else mkdir -p uploads; fi; exec node src/server.js"]
