# Production image for STEMPACT Backend API
FROM node:22-alpine

WORKDIR /app

# Install openssl and required dependencies for Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=5000

# Copy package descriptors
COPY package*.json ./

# Configure npm with high timeouts and retries for resilient installation
RUN npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-retries 5 \
    && npm config set fetch-timeout 300000 \
    && npm install --omit=dev --no-audit --no-fund

# Install prisma CLI for schema push and migrations
RUN npm install -g prisma@5.22.0

# Copy Prisma schema and generate client for Alpine Linux
COPY prisma ./prisma/
RUN npx prisma generate

# Copy pre-compiled JavaScript distribution
COPY dist ./dist/

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/index.js"]
