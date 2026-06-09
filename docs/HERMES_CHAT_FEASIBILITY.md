# Hermes / Qwen Chat Feasibility

Date: 2026-06-09

## Finding

A modern chat container is feasible, but it should not connect directly from the browser to Hermes, Ollama, Open WebUI, or any host-local agent process.

Current safe AI path:

- Command Display browser calls same-origin Cloudflare Pages Functions.
- Pages Functions call MBFDHub read-only display endpoints with server-side credentials.
- MBFDHub generates a sanitized descriptive AI snapshot using the local Qwen model path.
- The command app renders that output as read-only context with grounded fallback.

Hermes Agent is documented as a server-local operational agent. It is intentionally not exposed as a public browser endpoint. Exposing it directly would violate the command display boundaries because it could leak server context, credentials, runbook details, or operational capabilities.

## Safe Architecture Required Before Chat

A chat UI for administrators should use a new server-side, authenticated, audited, read-only endpoint. Recommended boundary:

1. Add a Hub-side endpoint such as `POST /api/admin/ai/read-only-chat` behind existing authenticated/admin middleware.
2. Keep the command-display browser same-origin behind Cloudflare Access.
3. Proxy chat only through MBFDHub or a dedicated Cloudflare Worker that validates Access identity and role.
4. Pass only allowlisted, redacted, read-only context into Qwen/Hermes.
5. Reject commands, remediation execution, write operations, deploy instructions, secrets, credentials, token text, and raw logs.
6. Rate-limit and audit every prompt/response.
7. Keep the existing `/api/display/*` data path GET-only.

## UI Recommendation

The command display can host a compact “Ask Hermes” panel once the safe endpoint exists, but the panel should be read-only/diagnostic:

- Suggested questions only, not freeform operational control.
- Clear “descriptive only” label.
- No command execution affordances.
- No direct server shell or admin mutation capabilities.
- Response citations to display snapshot sections when possible.

## Current Implementation Decision

No chat box was wired in this revamp because there is no safe read-only Hermes chat endpoint available to the command-display app today. The existing AI brief remains the safe production integration point.
