#!/usr/bin/env bash
# Puts this copy of survay on a Fly.io Sprite: https://docs.fly.io/sprites
# Run it again to ship changes. Answers stay in ~/survay-data on the Sprite.
set -euo pipefail

name=${1:?usage: deploy/sprite.sh <sprite-name>}
cd "$(dirname "$0")/.."
run() { sprite exec -s "$name" -- bash -lc "$1"; }

sprite list | grep -qx "$name" || sprite create "$name" --skip-console >/dev/null

{ git ls-files --cached --others --exclude-standard; if [ -f .env ]; then echo .env; fi; } \
  | tar -czf - -T - \
  | sprite exec -s "$name" -- bash -c 'rm -rf ~/survay.next && mkdir -p ~/survay.next && tar -xzf - -C ~/survay.next'

run 'cd ~/survay.next && { out=$(bun install --production --frozen-lockfile 2>&1) || { echo "$out"; exit 1; }; }
     rm -rf ~/survay.old && { [ ! -d ~/survay ] || mv ~/survay ~/survay.old; } && mv ~/survay.next ~/survay && rm -rf ~/survay.old
     mkdir -p ~/.local/bin && printf "%s\n" "#!/bin/sh" "cd ~/survay && SURVAY_DATA=~/survay-data exec bun src/cli.ts \"\$@\"" > ~/.local/bin/survay
     chmod +x ~/.local/bin/survay
     sprite-env services delete survay >/dev/null 2>&1 || true
     sprite-env services create survay --cmd /home/sprite/.local/bin/survay --args serve --env PORT=8080 --http-port 8080 --duration 3s >/dev/null'

sprite config update -s "$name" --url-auth public >/dev/null
url=$(sprite info -s "$name" | awk '/^URL:/ { print $2 }')

echo "survay is online

  survey     $url
  dashboard  $url/admin
  password   $(run 'survay password')

  from here  sprite exec -s $name -- survay results"
