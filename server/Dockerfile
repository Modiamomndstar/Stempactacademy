# Multi-stage production image for STEMPACT Backend API (Koyeb, Render & Docker)
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies needed by Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm install

# Generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and build TypeScript
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
RUN npm install -g prisma@5.22.0

COPY prisma ./prisma/
RUN npx prisma generate

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist/

RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/index.js"]
