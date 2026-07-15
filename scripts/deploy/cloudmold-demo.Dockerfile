FROM nginx:1.28.0-alpine

ARG VCS_REF=local
LABEL org.opencontainers.image.title="CloudMold admin web" \
      org.opencontainers.image.revision="${VCS_REF}"

COPY apps/web-antd/dist /usr/share/nginx/html
COPY scripts/deploy/cloudmold-demo.nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget --quiet --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
