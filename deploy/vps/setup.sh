#!/usr/bin/env bash
# RecipAI's backend on a server that already runs Caddy (the LAIN server). Run as root.
#   First install:  from the PC, .\vps.ps1 -Install   (clones the repo and runs this)
#   Update:         recipai-update                      (runs this again; the config is kept)
#   Other branch:   RECIPAI_BRANCH=feat/x recipai-update   (remembered in /etc/recipai/branch)
set -euo pipefail

APP=/opt/recipai
VENV=/opt/recipai-venv
CONF=/etc/recipai
ENV_FILE=$CONF/recipai.env
PORT=8300

step() { printf '\n== %s\n' "$*"; }

main() {
  [ "$(id -u)" -eq 0 ] || { echo "Ejecuta este script como root." >&2; exit 1; }
  cd /
  install -d -o root -g root -m 700 "$CONF"
  local branch host ip
  branch=${RECIPAI_BRANCH:-$(cat "$CONF/branch" 2>/dev/null || echo main)}
  host=${RECIPAI_HOST:-$(cat "$CONF/host" 2>/dev/null || true)}
  if [ -z "$host" ]; then
    # Free HTTPS name next to LAIN's: 1.2.3.4 -> recipai.1-2-3-4.sslip.io resolves back to this IP.
    ip=$(ip -4 route get 1.1.1.1 | awk '{for (i = 1; i < NF; i++) if ($i == "src") { print $(i + 1); exit }}')
    host=recipai.${ip//./-}.sslip.io
  fi
  echo "$branch" > "$CONF/branch"
  echo "$host" > "$CONF/host"

  step "Paquetes del sistema"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -q
  apt-get install -y -q --no-upgrade python3-venv git curl

  step "Usuario"
  id recipai >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin recipai

  step "Código ($branch)"
  # recipai-update fetches before running this; the first install is cloned by vps.ps1.
  git -C "$APP" log -1 --format='%h %s'
  [ -x "$VENV/bin/python" ] || python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --disable-pip-version-check -r "$APP/backend/requirements.txt"

  step "Configuración"
  if [ ! -f "$ENV_FILE" ]; then
    install -m 600 /dev/null "$ENV_FILE"
    cat > "$ENV_FILE" <<EOF
# RecipAI, written once by setup.sh. After editing: systemctl restart recipai
# The Gemini key is set with recipai-set-key (from the PC: .\vps.ps1 -Gemini).
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest
# Canned recipes until a Gemini key is set.
RECIPAI_DEMO=1
# The app sends this in X-RecipAI-Token (from the PC: .\vps.ps1 -AppEnv writes mobile/.env).
RECIPAI_APP_TOKEN=$(python3 -c 'import secrets; print(secrets.token_urlsafe(24))')
RECIPAI_RATE_LIMIT_PER_HOUR=30
RECIPAI_MAX_IMAGE_MB=6
PYTHONDONTWRITEBYTECODE=1
EOF
  else
    echo "Se conserva $ENV_FILE"
  fi

  step "Servicio"
  install -m 755 "$APP"/deploy/vps/bin/* /usr/local/sbin/
  install -m 644 "$APP"/deploy/vps/systemd/* /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable -q recipai.service
  systemctl restart recipai.service

  step "Caddy ($host)"
  install -d -m 755 /etc/caddy/sites.d
  sed "s/__HOST__/$host/; s/__PORT__/$PORT/" "$APP/deploy/vps/recipai.caddy" > /etc/caddy/sites.d/recipai.caddy
  # LAIN's Caddyfile template imports sites.d; add the line if it is missing so this site works.
  grep -qxF 'import /etc/caddy/sites.d/*.caddy' /etc/caddy/Caddyfile \
    || printf '\n# Other sites on this server, one file each.\nimport /etc/caddy/sites.d/*.caddy\n' >> /etc/caddy/Caddyfile
  local check
  if ! check=$(caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1); then
    echo "$check" >&2
    rm -f /etc/caddy/sites.d/recipai.caddy
    echo "Caddy no acepta la configuración: se ha retirado el sitio de RecipAI y lo demás sigue igual." >&2
    exit 1
  fi
  systemctl reload caddy

  step "Comprobación"
  local ok=""
  for _ in $(seq 1 30); do
    if curl -fsS --max-time 5 "https://$host/health" >/dev/null 2>&1; then ok=1; break; fi
    sleep 3
  done
  echo
  if [ -n "$ok" ]; then
    echo "LISTO: https://$host/health"
    recipai-status
  else
    echo "RecipAI arrancó, pero https://$host aún no responde."
    echo "Revisa: systemctl status recipai caddy; journalctl -u recipai -n 50  (el certificado puede tardar un minuto)"
    exit 1
  fi
}

main "$@"
