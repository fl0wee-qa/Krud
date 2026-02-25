FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY tsconfig.base.json tsconfig.base.json

RUN npm ci

COPY apps/api apps/api
COPY packages/shared packages/shared

RUN npm run prisma:generate --workspace @krud/api
RUN npm run build --workspace @krud/api

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "start", "--workspace", "@krud/api"]
