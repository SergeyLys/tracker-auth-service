FROM node:20-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.21.0



FROM base AS dev

ARG GITHUB_TOKEN

ENV GITHUB_TOKEN=$GITHUB_TOKEN

RUN npm install -g @nestjs/cli

COPY backend/auth-service ./backend/auth-service

WORKDIR /app/backend/auth-service

RUN pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]


FROM base AS build

COPY . .

RUN --mount=type=secret,id=github_token \
  sh -c 'echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/github_token)" > .npmrc && \
  pnpm install --frozen-lockfile && \
  rm -f .npmrc'
RUN pnpm run build


FROM base AS production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]