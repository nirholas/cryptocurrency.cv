#!/bin/bash
set -e

# Prettify GitHub file browser for agent-voice-chat
# Each root-level file/folder gets a unique emoji commit message

REPO_PATH="${1:-/tmp/agent-voice-chat}"

# Clone if needed
if [ ! -d "$REPO_PATH" ]; then
    echo "📥 Cloning agent-voice-chat..."
    git clone https://github.com/nirholas/agent-voice-chat.git "$REPO_PATH"
fi

cd "$REPO_PATH"

git config user.name "nirholas"
git config user.email "nirholas@users.noreply.github.com"

# Step 1: Squash all history
echo "📦 Squashing all history..."
git checkout --orphan temp_branch
git add -A
git commit -m "🎉 Initial commit"
git branch -D main || true
git branch -m main

# Step 2: Create individual pretty commits per file/folder

prettify() {
    local path="$1"
    local msg="$2"

    if [ ! -e "$path" ]; then
        echo "  ⏭️  SKIP (not found): $path"
        return
    fi

    if [ -d "$path" ]; then
        local target
        target=$(find "$path" -type f -not -path '*/.git/*' -not -path '*/node_modules/*' | head -1)
        if [ -n "$target" ]; then
            echo "" >> "$target"
            git add "$path"
            git commit -m "$msg" 2>/dev/null || echo "  ⏭️  no changes: $path"
        fi
    elif [ -f "$path" ]; then
        echo "" >> "$path"
        git add "$path"
        git commit -m "$msg" 2>/dev/null || echo "  ⏭️  no changes: $path"
    fi
    echo "  ✅ $msg"
}

echo ""
echo "🎨 Creating pretty commits..."
echo ""

# ── Folders ──────────────────────────────────────────────────
prettify "providers"        "🔌 providers — LLM, TTS & STT integrations"
prettify "src/server"       "🖥️ src/server — Express routes & middleware"
prettify "src/client"       "📡 src/client — XSpace API client"
prettify "packages/core"    "📦 packages/core — Base client library"
prettify "packages/react"   "⚛️ packages/react — React hooks & components"
prettify "packages/vue"     "💚 packages/vue — Vue composables & components"
prettify "packages/widget"  "🧩 packages/widget — Embeddable voice widget"
prettify "public"           "🌐 public — Landing page & static assets"
prettify "lib"              "🧠 lib — Memory, RAG & knowledge base"
prettify "docs"             "📚 docs — Guides & API reference"
prettify "tests"            "✅ tests — Unit, e2e & resilience tests"
prettify "scripts"          "🔧 scripts — Utility & migration scripts"
prettify ".github"          "🐙 .github — GitHub Actions & templates"
prettify ".well-known"      "🔗 .well-known — Discovery metadata"
prettify "knowledge"        "📖 knowledge — Knowledge base documents"
prettify "memory"           "💾 memory — Conversation memory store"

# ── Core files ───────────────────────────────────────────────
prettify "server.js"            "🚀 server.js — Express + Socket.IO entry point"
prettify "agent-registry.js"    "🤖 agent-registry.js — Dynamic agent management"
prettify "room-manager.js"      "🏠 room-manager.js — Multi-room isolation"
prettify "agents.config.json"   "🎭 agents.config.json — Agent personalities"
prettify "openapi.json"         "📋 openapi.json — OpenAPI specification"
prettify "Dockerfile"           "🐳 Dockerfile — Container build config"
prettify "docker-compose.yml"   "🐳 docker-compose.yml — Multi-service orchestration"

# ── Config files ─────────────────────────────────────────────
prettify "package.json"         "📦 package.json — Dependencies & scripts"
prettify "package-lock.json"    "🔒 package-lock.json — Dependency lockfile"
prettify "vitest.config.js"     "🧪 vitest.config.js — Test configuration"
prettify "tsconfig.json"        "🏷️ tsconfig.json — TypeScript configuration"
prettify ".editorconfig"        "📏 .editorconfig — Editor formatting rules"
prettify ".eslintrc.json"       "🔍 .eslintrc.json — Linting rules"

# ── Documentation ────────────────────────────────────────────
prettify "README.md"            "📖 README.md — Project documentation"
prettify "CONTRIBUTING.md"      "🤝 CONTRIBUTING.md — Contribution guide"
prettify "CLAUDE.md"            "🧩 CLAUDE.md — Architecture reference"
prettify "AGENTS.md"            "🤖 AGENTS.md — Agent instructions"
prettify "LICENSE"              "⚖️ LICENSE — MIT License"
prettify "llms.txt"             "🤖 llms.txt — LLM context file"
prettify "llms-full.txt"        "📝 llms-full.txt — Full LLM reference"
prettify "CHANGELOG.md"         "📋 CHANGELOG.md — Release history"

# ── Dotfiles ─────────────────────────────────────────────────
prettify ".env.example"         "🔐 .env.example — Environment variables template"
prettify ".gitignore"           "🙈 .gitignore — Ignored files config"
prettify ".npmignore"           "📤 .npmignore — npm publish ignore rules"

echo ""
echo "🚀 Force pushing to origin..."
git push -f origin main

echo ""
echo "✨ Done! agent-voice-chat now has pretty commit messages!"
echo "   Visit: https://github.com/nirholas/agent-voice-chat"
