#!/bin/bash
# release.sh — build, commit, pull, push, and tag in one command.
# Usage: ./release.sh 1.0.8 "optional commit message"

set -e  # exit on any error

VERSION="${1}"
MESSAGE="${2:-"release: v${VERSION}"}"

if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh <version> [commit message]"
  echo "Example: ./release.sh 1.0.8"
  exit 1
fi

# Validate version format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: version must be in X.Y.Z format (e.g. 1.0.8)"
  exit 1
fi

echo "→ Building assets..."
npm run build

echo "→ Staging changes..."
git add -A

echo "→ Committing: $MESSAGE"
git commit -m "$MESSAGE" || echo "  (nothing new to commit)"

echo "→ Pulling latest main..."
git pull origin main --no-rebase

echo "→ Pushing to main..."
git push origin main

echo "→ Tagging v$VERSION..."
git tag "v$VERSION"
git push origin "v$VERSION"

echo ""
echo "✓ Done! GitHub Action is now building boostcart-v$VERSION.zip"
echo "  Check progress at: https://github.com/affi1504/boostcart/actions"
