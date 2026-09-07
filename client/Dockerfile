# Multi-stage Dockerfile for STEMPACT Client Frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build production assets using Vite
RUN npm run build

# Production server stage with Nginx
FROM nginx:alpine AS runner

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
