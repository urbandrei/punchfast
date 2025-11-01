# ---- build React app ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV CI=1
RUN npm run build

# ---- serve with nginx ----
FROM nginx:1.27-alpine
# our nginx config already proxies /api -> backend
COPY nginx.conf /etc/nginx/conf.d/default.conf
# ensure no stale files remain
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
