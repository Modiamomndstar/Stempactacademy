# Production server stage with Nginx for STEMPACT Client Frontend
FROM nginx:alpine

# Copy pre-built production assets from Vite build
COPY dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback and API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
