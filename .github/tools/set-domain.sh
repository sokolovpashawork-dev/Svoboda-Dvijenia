#!/usr/bin/env bash
# Смена адреса сайта во всех файлах одним действием.
# Использование:  bash .github/tools/set-domain.sh https://example.ru/
# (адрес с https:// и слэшем на конце; основной адрес — один, без www или с www, как решите)
set -euo pipefail
NEW="${1:-}"
[[ "$NEW" =~ ^https://[a-z0-9.-]+\.[a-z]{2,}/$ ]] || { echo "Укажите адрес вида https://example.ru/"; exit 1; }
cd "$(dirname "$0")/../.."
OLD="https://sokolovpashawork-dev.github.io/Svoboda-Dvijenia/"
FILES="index.html 404.html robots.txt sitemap.xml .github/README.md"
for f in $FILES; do sed -i "s|${OLD}|${NEW}|g" "$f"; done
HOST="${NEW#https://}"; HOST="${HOST%/}"
echo "$HOST" > CNAME
echo "Готово: адрес заменён на ${NEW}, создан файл CNAME (${HOST})."
echo "Проверка остатков старого адреса:"
grep -rn "github.io" $FILES || echo "  старых ссылок не осталось"
