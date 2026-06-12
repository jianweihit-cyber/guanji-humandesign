# 观己·人类图 — 纯静态站（页面 + 引擎模块 + swisseph-wasm），nginx 托管
# 注意：swisseph.data 须先经 tools/repack-swisseph-data.mjs 瘦身（12MB→2MB）再构建
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY web /usr/share/nginx/html/web
COPY src /usr/share/nginx/html/src
COPY node_modules/swisseph-wasm /usr/share/nginx/html/node_modules/swisseph-wasm
# 构建期预压缩：gzip_static 直接命中 .gz，运行时零压缩 CPU
# 剔除 repack 备份与原始 12MB 包（线上只发 swisseph-lite.data）
RUN rm -f /usr/share/nginx/html/node_modules/swisseph-wasm/wasm/*.orig \
       /usr/share/nginx/html/node_modules/swisseph-wasm/wasm/swisseph.data \
 && find /usr/share/nginx/html -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.json' -o -name '*.svg' -o -name '*.wasm' -o -name '*.data' \) -exec gzip -9 -k {} +
EXPOSE 8080
