FROM node:20-slim

# Hugging Face Spaces runs containers as uid 1000.
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user PATH=/home/user/.local/bin:$PATH
WORKDIR $HOME/app

COPY --chown=user package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=user . .

ENV NODE_ENV=production PORT=7860 HOST=0.0.0.0
EXPOSE 7860

# /data exists only at runtime and only when a storage bucket is attached, so
# fall back to the ephemeral directory when it is absent. exec keeps node as
# PID 1 so it receives shutdown signals.
CMD ["sh","-c","if mkdir -p /data/uploads 2>/dev/null; then ln -sfn /data/uploads uploads; else mkdir -p uploads; fi; exec node src/server.js"]
