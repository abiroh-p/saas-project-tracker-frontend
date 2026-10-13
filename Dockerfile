# syntax=docker/dockerfile:1

# ---- build -------------------------------------------------------------------------------------
# Angular 22 needs Node >= 22.22.3 or >= 24.15; node:24 satisfies that.
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build -- --configuration production

# ---- runtime -----------------------------------------------------------------------------------
# Unprivileged nginx (non-root, listens on 8080). Pin by digest once Dependabot is set up.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/security-headers.inc /etc/nginx/conf.d/security-headers.inc
COPY --from=build /app/dist/project-tracker-frontend/browser /usr/share/nginx/html

ENV API_UPSTREAM=http://api:8000
EXPOSE 8080
