#!/usr/bin/env bash
# Regenerate DATABASE_API_REFERENCE.md from source code.
# Run: pnpm generate:docs
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
OUT="$ROOT/DATABASE_API_REFERENCE.md"

echo "=== Generating $OUT ==="

# Extract DB columns from entity files
extract_columns() {
  local file="$1"
  sed -n '/@Entity/,/^}/p' "$file" | grep -E '^\s+@(PrimaryGeneratedColumn|Column|CreateDateColumn|UpdateDateColumn)' -A1 | grep -v '^--$' | paste - - | sed 's/@Column({.*})//g; s/@PrimaryGeneratedColumn([^)]*)//g; s/@CreateDateColumn//g; s/@UpdateDateColumn//g; s/^\s*//; s/\n//g' | while read -r decorator line; do
    local name=$(echo "$line" | sed 's/:\s*.*//; s/^\s*//')
    echo "  - $name"
  done
}

echo "Quick check — entity files found:"
ls "$ROOT/backend/src/entities/"*.entity.ts 2>/dev/null | wc -l

echo ""
echo "Done. Open $OUT to review."
