# Stage 1: Build React Production Bundle
FROM node:20-alpine AS build

WORKDIR /app

# Build-time backend API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Web Server with Nginx
FROM nginx:alpine

ENV PORT=80

# Copy built assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Use template directory for automatic envsubst of $PORT on container startup
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:${PORT}/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

