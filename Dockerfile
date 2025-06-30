FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts && npm cache clean --force

COPY . .

RUN npm run build

RUN npm ci --only=production --ignore-scripts && npm cache clean --force

FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

CMD ["npm", "run", "start:prod"]