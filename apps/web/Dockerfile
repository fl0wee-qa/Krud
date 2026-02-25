FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY tsconfig.base.json tsconfig.base.json

RUN npm ci

COPY apps/web apps/web
COPY packages/shared packages/shared

RUN npm run build --workspace @krud/web

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "@krud/web"]
