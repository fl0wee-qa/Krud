FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY tsconfig.base.json tsconfig.base.json

RUN npm install

COPY apps/api apps/api
COPY packages/shared packages/shared

WORKDIR /app/apps/api
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
