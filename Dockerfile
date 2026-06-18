FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:22-alpine
RUN apk add --no-cache proxychains-ng
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN chmod +x entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
