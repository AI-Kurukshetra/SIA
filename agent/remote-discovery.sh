#!/usr/bin/env bash

set -euo pipefail

print_section() {
  local name="$1"
  shift
  echo "===SIA:${name}:BEGIN==="
  "$@" 2>/dev/null || true
  echo "===SIA:${name}:END==="
}

print_section "HOSTNAME" hostname
print_section "OS_RELEASE" cat /etc/os-release
print_section "KERNEL" uname -a
print_section "UPTIME" uptime
print_section "LISTENING_PORTS" sh -c "ss -tulpn || netstat -tulpn"
print_section "ESTABLISHED_CONNECTIONS" sh -c "ss -tunp state established || netstat -tunp"
print_section "SYSTEMD_SERVICES" sh -c "systemctl list-units --type=service --all --no-pager --no-legend"
print_section "TOP_PROCESSES" sh -c "ps -eo pid,comm,%cpu,%mem,args --sort=-%cpu | head -n 25"
print_section "PROJECT_MARKERS" sh -c '
  find /var/www /srv /opt /home -maxdepth 4 \
    \( -name package.json -o -name docker-compose.yml -o -name Dockerfile -o -name pyproject.toml -o -name requirements.txt -o -name pom.xml -o -name composer.json -o -name Gemfile -o -name manage.py \) \
    -type f 2>/dev/null | head -n 80
'
print_section "CRON" sh -c "crontab -l"
print_section "PACKAGES" sh -c "dpkg-query -W -f='\${Package}\t\${Version}\n' 2>/dev/null | head -n 120 || rpm -qa 2>/dev/null | head -n 120"
print_section "PACKAGE_HINTS" sh -c '
  for cmd in nginx apache2 httpd docker dockerd node npm python3 java psql redis-server redis-cli mysqld postgres pm2 fail2ban-client; do
    if command -v "$cmd" >/dev/null 2>&1; then
      printf "%s\t%s\n" "$cmd" "$("$cmd" --version 2>&1 | head -n 1)"
    fi
  done
'
print_section "CONFIG_HINTS" sh -c '
  for path in /etc/nginx/nginx.conf /etc/ssh/sshd_config /etc/docker/daemon.json /etc/crontab; do
    if [ -f "$path" ]; then
      echo "FILE $path"
      sed -n "1,80p" "$path"
    fi
  done
'
print_section "WEBSERVER_CONFIGS" sh -c '
  for path in /etc/nginx/nginx.conf /etc/nginx/sites-enabled/* /etc/apache2/sites-enabled/* /etc/httpd/conf/httpd.conf /etc/httpd/conf.d/*.conf; do
    if [ -f "$path" ]; then
      echo "FILE $path"
      sed -n "1,120p" "$path"
    fi
  done
'
