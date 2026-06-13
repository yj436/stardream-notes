FROM node:22-bookworm-slim

WORKDIR /app

ARG DATABASE_URL=mysql://stardream:stardream@127.0.0.1:3306/stardream_notes
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=production
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev
RUN npm run db:generate

COPY server ./server
COPY scripts ./scripts

RUN mkdir -p uploads

EXPOSE 3001

CMD ["npm", "run", "start:api"]
