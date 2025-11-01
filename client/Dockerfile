# --- build stage ---
FROM node:18-bullseye AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- serve stage ---
FROM nginx:1.25-alpine
# your reverse proxy rules
COPY nginx.conf /etc/nginx/conf.d/default.conf
# remove default html, copy fresh build
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build/ /usr/share/nginx/html/
EXPOSE 80
