FROM nginx:stable-alpine

RUN rm -f /etc/nginx/conf.d/default.conf

COPY scripts/deploy/cloudmold-demo.nginx.conf /etc/nginx/nginx.conf
COPY apps/web-antd/dist /usr/share/nginx/html

EXPOSE 8080
