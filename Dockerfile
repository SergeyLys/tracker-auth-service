FROM node:20-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.21.0

ARG GITHUB_TOKEN

ENV GITHUB_TOKEN=$GITHUB_TOKEN


FROM base AS dev

RUN npm install -g @nestjs/cli

COPY backend/auth-service ./backend/auth-service

WORKDIR /app/backend/auth-service

RUN pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]


FROM base AS build

COPY backend/auth-service ./backend/auth-service

WORKDIR /app/backend/auth-service

RUN pnpm install --frozen-lockfile
RUN pnpm run build


FROM base AS production

COPY --from=build /app/backend/auth-service/package.json ./package.json
COPY --from=build /app/backend/auth-service/node_modules ./node_modules
COPY --from=build /app/backend/auth-service/dist ./dist

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]