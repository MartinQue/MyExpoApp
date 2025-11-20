# MCP Servers for MyExpoApp

This project now ships with the two Expo-aligned MCP providers so that Claude, Cursor, or any other MCP-aware client can reason about the app and Expo’s documentation.

## 1. Expo project automation (`expo-mcp`)

Installed as a dev dependency (`expo-mcp@0.1.15`). It exposes tools for:

- querying Expo Router sitemaps
- opening React Native DevTools
- device automation (tap, screenshot, find/tap by `testID`)

### Run locally

In one shell start the Expo dev server (for example `npm run dev`). In another shell:

```bash
cd /Users/martinquansah/MyExpoApp
npx expo-mcp --root . --dev-server-url http://localhost:8081
```

Adjust `--dev-server-url` if Metro is on a different host or port.

### Connect to Claude / Cursor

Add a server entry that runs the command above. Examples:

**Claude Desktop (`claude_desktop_config.json`):**

```json
{
  "mcpServers": {
    "expo-local": {
      "command": "npx",
      "args": [
        "expo-mcp",
        "--root",
        "/Users/martinquansah/MyExpoApp",
        "--dev-server-url",
        "http://localhost:8081"
      ]
    }
  }
}
```

**Smithery CLI (Claude Desktop / Code):**

```bash
npx -y @smithery/cli install expo-mcp --client claude
```

When prompted for config, set the project root and dev-server URL.

## 2. Expo documentation semantic search (`expo-docs-mcp`)

Bundled under `expo-docs-mcp/` (pre-indexed docs for SDK 51–latest).

### Run locally

```bash
# once per shell session
export OPENAI_API_KEY="sk-..."

cd /Users/martinquansah/MyExpoApp/expo-docs-mcp
npm install   # already installed, rerun after updates
npx expo-docs-mcp
```

If you add `export OPENAI_API_KEY="sk-..."` to `~/.zshrc` it will be available automatically.

### Client configuration

Add another MCP entry that runs the command above. The Claude config we ship now executes:

```json
"command": "bash",
"args": [
  "-lc",
  "OPENAI_API_KEY=${OPENAI_API_KEY:?\\nSet OPENAI_API_KEY before launching expo-docs-mcp} npx expo-docs-mcp"
]
```

So as long as `OPENAI_API_KEY` is defined in your shell (or in `~/.zshrc`), Claude picks it up automatically. Change that command the same way for any other MCP-aware client if you prefer.

## Verifying availability

Use the MCP introspection built into your client (for Claude Desktop run “List connected MCP servers”) and ensure the tooling appears:

- `expo_router_sitemap`, `automation_*`, `open_devtools`
- `search-expo-docs`

With both providers active you can ask your AI agent to inspect live UI, capture screenshots, and pull relevant Expo docs without leaving the editor.
