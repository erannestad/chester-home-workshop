#!/bin/zsh
# Resize photos for Pages CMS (~1 MB JPEG, always under 3 MB).
# Writes a sibling file named {name}-cms.jpg and leaves the original alone.

set -euo pipefail

TARGET=1100000
CEILING=2800000
MAX_EDGE=3600

kb() {
  python3 -c "print(f'{int($1)/1024:.0f} KB')"
}

resize_one() {
  local src=$1
  if [[ ! -f $src ]]; then
    print -u2 "Skip (not a file): $src"
    return 1
  fi

  local dir=${src:A:h}
  local name=${src:t}
  local stem=${name%.*}
  stem=${stem%-cms}
  local out="$dir/${stem}-cms.jpg"
  local tmp
  tmp="$(mktemp -t cmsresize).jpg"

  local edge=$MAX_EDGE
  local q=84
  local size=0

  export_once() {
    /usr/bin/sips -s format jpeg -s formatOptions "$q" \
      --resampleHeightWidthMax "$edge" "$src" --out "$tmp" >/dev/null
    size=$(stat -f%z "$tmp")
  }

  export_once

  while (( size > TARGET && q > 60 )); do
    q=$((q - 6))
    export_once
  done

  while (( size > TARGET && edge > 1800 )); do
    edge=$((edge - 400))
    export_once
  done

  if (( size > CEILING )); then
    print -u2 "Still too large ($(kb $size)): $out"
    rm -f "$tmp"
    return 1
  fi

  mv -f "$tmp" "$out"
  print "$(kb $size)  ${out:t}"
}

failed=0
ok=0
for src in "$@"; do
  if resize_one "$src"; then
    ok=$((ok + 1))
  else
    failed=$((failed + 1))
  fi
done

if (( ok + failed == 0 )); then
  print -u2 "Drop image files on this action, or pass paths as arguments."
  exit 1
fi

/usr/bin/osascript -e "display notification \"${ok} photo(s) ready for the website\" with title \"Resize for website\"" >/dev/null 2>&1 || true

(( failed == 0 ))
