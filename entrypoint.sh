#!/bin/sh
if [ -n "$SOCKS_PROXY" ]; then
  host=$(echo "$SOCKS_PROXY" | sed 's|^socks5[h]*://||' | cut -d: -f1)
  port=$(echo "$SOCKS_PROXY" | sed 's|^socks5[h]*://||' | cut -d: -f2)
  cat > /etc/proxychains/proxychains.conf <<EOF
strict_chain
proxy_dns
tcp_read_time_out 15000
tcp_connect_time_out 8000
[ProxyList]
socks5 $host $port
EOF
  exec proxychains4 -q node server.js
fi
exec node server.js
