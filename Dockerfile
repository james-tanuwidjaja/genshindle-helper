# syntax=docker/dockerfile:1

# ---- Build stage: compile the Vue app into static files ----
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies first so this layer is cached unless package files change.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the source and build. Override Vite's GitHub Pages base ("/genshindle-helper/")
# so the app is served from the container root (http://localhost:8080/).
COPY . .
RUN npm run build -- --base=/

# ---- Serve stage: a tiny nginx image with only the built files ----
FROM nginx:alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# nginx:alpine runs the server in the foreground by default — no CMD needed.
