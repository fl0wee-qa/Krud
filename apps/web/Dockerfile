FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY tsconfig.base.json tsconfig.base.json

RUN npm install

COPY apps/web apps/web
COPY packages/shared packages/shared

WORKDIR /app/apps/web
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
