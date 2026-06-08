# AI Briefing

The display shows a **descriptive-only** operational brief. It never recommends actions, and it
runs entirely server-side.

## Where it runs

`GET /api/ai-snapshot` (edge) → hub `/api/display/ai-snapshot` → `DisplayAiService` →
`GenerateDisplayAiSnapshotJob` → local **qwen3.6:35b** via the hub's `LocalAIService`
(Ollama, `host.docker.internal:11434`). **There is no browser-to-Ollama path** — the model is
never exposed publicly. The brief is change-driven (fingerprint) cached (~30 min TTL).

## Response states

- **200** — fresh or stale brief.
- **202** `{status:"generating"}` — no cached brief yet; a job was dispatched. The UI shows
  "Generating briefing…" and keeps polling (60s).
- **504 / last-good** — LLM unreachable; the edge returns the last-good brief from KV, or an
  explicit `status:"unavailable"` placeholder. The UI shows a non-blocking banner.

## Output schema

```jsonc
{
  "mode": "descriptive",
  "briefing": "string",                          // grounded prose summary
  "station_summaries": [{ "station": "...", "summary": "..." }],
  "active_run_summary": "string",
  "camera_source_summary": "string",
  "data_gaps": ["string"],                        // explicit "missing/stale" callouts
  "confidence": 0.0,                              // 0..1
  "generated_at": "ISO8601",
  "model": "qwen3.6:35b"
}
```

## Guards (anti-hallucination, descriptive-only)

- **Grounding** — the prompt instructs the model to describe only what the sanitized snapshot
  shows; missing/stale data must be reported in `data_gaps`.
- **Forbidden language** — recommendations and the words *should / must / recommend / need to /
  take action* are rejected; a post-generation guard strips offending sentences and lowers
  `confidence` if any are found.
- **JSON-only** — the model must emit valid JSON (no markdown); the client tolerates a
  `{raw_response}` fallback shape.
- **PII stripped before the LLM** — names, addresses, VINs, serials, budgets, and internal notes
  are removed from the snapshot the job sends to the model.

The UI ([`AiOperationalBrief`](../src/components/command/AiOperationalBrief.tsx) /
[`StationAiSummary`](../src/components/station/StationAiSummary.tsx)) always shows the model id,
the brief age, a confidence bar, and any `data_gaps` as warning chips. It renders last-good while
regenerating and never blocks on a spinner.
