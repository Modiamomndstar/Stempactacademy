# Multi-stage Dockerfile for STEMPACT Backend API
FROM node:22-alpine AS builder

WORKDIR /app

# Install openssl and required dependencies for Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy package descriptors
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source files and build TypeScript
COPY src ./src/
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=5000

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

# Push schema changes and start server
CMD ["node", "dist/index.js"]
