# 观己·人类图 — 纯静态站（页面 + 引擎模块 + swisseph-wasm），nginx 托管
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY web /usr/share/nginx/html/web
COPY src /usr/share/nginx/html/src
COPY node_modules/swisseph-wasm /usr/share/nginx/html/node_modules/swisseph-wasm
EXPOSE 8080
