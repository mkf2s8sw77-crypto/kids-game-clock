#!/bin/bash
set -e

CONF=/opt/homebrew/etc/nginx/servers/gateway-huli.conf
TS=$(date +"%Y%m%d-%H%M%S")

sudo mkdir -p /opt/homebrew/etc/nginx/_archive/$TS
sudo cp "$CONF" /opt/homebrew/etc/nginx/_archive/$TS/gateway-huli.conf.bak

sudo python3 - <<'PY'
path = '/opt/homebrew/etc/nginx/servers/gateway-huli.conf'
with open(path, 'r') as f:
    content = f.read()

old = '''# --- app-deploy begin host=sys.huli.sh.cn path=/kids-game-clock/ ---
location = /kids-game-clock {
  absolute_redirect off;
  return 302 /kids-game-clock/;
}
location ^~ /kids-game-clock/ {
  proxy_pass http://127.0.0.1:60630;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Port $server_port;
  proxy_connect_timeout 60s;
  proxy_send_timeout 60s;
  proxy_read_timeout 60s;
}
# --- app-deploy end host=sys.huli.sh.cn path=/kids-game-clock/ ---'''

new = '''# --- app-deploy begin host=sys.huli.sh.cn path=/kids-game-clock/ ---
location = /kids-game-clock {
  proxy_pass http://127.0.0.1:60630;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Port $server_port;
  proxy_connect_timeout 60s;
  proxy_send_timeout 60s;
  proxy_read_timeout 60s;
}
location ^~ /kids-game-clock/ {
  proxy_pass http://127.0.0.1:60630;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Port $server_port;
  proxy_connect_timeout 60s;
  proxy_send_timeout 60s;
  proxy_read_timeout 60s;
}
# --- app-deploy end host=sys.huli.sh.cn path=/kids-game-clock/ ---'''

if old not in content:
    print('ERROR: marker block not found')
    exit(1)

content = content.replace(old, new)
with open(path, 'w') as f:
    f.write(content)
print('nginx config updated')
PY

sudo /opt/homebrew/bin/nginx -t
sudo /opt/homebrew/bin/nginx -s reload

echo "修复完成，请访问 https://sys.huli.sh.cn/kids-game-clock/ 验证。"
