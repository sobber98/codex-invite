#!/bin/sh
if [ -n "$SOCKS_PROXY" ]; then
  rest="${SOCKS_PROXY#socks5://}"
  rest="${rest#socks5h://}"

  case "$rest" in
    *@*)
      userpass="${rest%%@*}"
      hostport="${rest#*@}"
      user="${userpass%%:*}"
      pass="${userpass#*:}"
      [ "$pass" = "$user" ] && pass=""
      ;;
    *)
      hostport="$rest"
      user=""
      pass=""
      ;;
  esac

  host="${hostport%%:*}"
  port="${hostport#*:}"
  [ "$port" = "$host" ] && port="1080"

  if [ -n "$user" ]; then
    proxy_line="socks5 $host $port $user${pass:+ $pass}"
  else
    proxy_line="socks5 $host $port"
  fi
  cat > /etc/proxychains/proxychains.conf <<EOF
strict_chain
proxy_dns
tcp_read_time_out 15000
tcp_connect_time_out 8000
[ProxyList]
$proxy_line
EOF
  exec proxychains4 -q node server.js
fi
exec node server.js
