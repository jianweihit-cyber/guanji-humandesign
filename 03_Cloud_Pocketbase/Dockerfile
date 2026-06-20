# 观己·五行 云端后端 —— Pocketbase 单文件后端（账号鉴权 + 排盘记录库 + 管理后台）
FROM alpine:3.20
ARG PB_VERSION=0.39.4
RUN apk add --no-cache ca-certificates unzip wget
RUN wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -O /tmp/pb.zip \
 && unzip /tmp/pb.zip -d /pb/ && rm /tmp/pb.zip
# 迁移(建/改集合，启动自动执行) + JS 钩子(配额硬限等)。PB 默认从 /pb/pb_migrations、/pb/pb_hooks 加载。
COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
# 运营总览看板(只读聚合)：PB 默认托管 pb_public → cloud.zaiyuxingzhe.com/dashboard.html
COPY pb_public /pb/pb_public
EXPOSE 8080
# pb_data（SQLite + 上传文件）挂在 Fly 卷上持久化
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data"]
