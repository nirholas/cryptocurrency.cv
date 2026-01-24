#!/bin/bash
# Sync unique files from CDA repo to free-crypto-news
# Run this script from the workspace root

CDA_SOURCE="/tmp/cda-source"
TARGET="/workspaces/free-crypto-news"

echo "=== Comparing repositories ==="
echo ""

# Check if CDA source exists
if [ ! -d "$CDA_SOURCE" ]; then
    echo "ERROR: CDA source not found at $CDA_SOURCE"
    exit 1
fi

echo "=== Files only in CDA (candidates to copy) ==="
diff -rq "$CDA_SOURCE/src" "$TARGET/src" 2>/dev/null | grep "Only in /tmp/cda-source" | head -100

echo ""
echo "=== To copy all unique CDA files, run: ==="
echo "rsync -av --ignore-existing $CDA_SOURCE/src/ $TARGET/src/"

echo ""
echo "=== Or to fully sync (overwrite): ==="
echo "rsync -av $CDA_SOURCE/src/ $TARGET/src/"

echo ""
read -p "Do you want to sync CDA files (preserving existing)? [y/N] " response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Syncing..."
    rsync -av --ignore-existing "$CDA_SOURCE/src/" "$TARGET/src/"
    echo "Done! Check for any import errors."
else
    echo "Skipped. Run manually if needed."
fi
