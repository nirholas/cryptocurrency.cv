#!/bin/bash
# Script to compare CDA source with free-crypto-news and copy unique files

echo "=== Comparing repositories ==="
echo ""

echo "=== Files only in CDA (not in free-crypto-news) ==="
diff -rq /tmp/cda-source/src /workspaces/free-crypto-news/src 2>&1 | grep "Only in /tmp/cda-source" | head -100

echo ""
echo "=== Files that differ between repos ==="
diff -rq /tmp/cda-source/src /workspaces/free-crypto-news/src 2>&1 | grep "differ" | head -50
