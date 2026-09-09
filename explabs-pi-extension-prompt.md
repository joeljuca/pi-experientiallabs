# Implement a Pi Extension for Experiential Labs

## Goal

Create a pi extension that registers **Experiential Labs** as a model provider in [pi](https://github.com/earendil-works/pi-coding-agent), with **dynamic model discovery** — models are fetched from the Experiential Labs API whenever pi refreshes the model list (e.g., when the user opens `/model`).

---

## Background: Pi Extensions

Pi extensions are TypeScript modules that extend pi's behavior. They can register providers, tools, commands, and subscribe to lifecycle events. Extensions are loaded via [jiti](https://github.com/unjs/jiti), so TypeScript works without compilation.

### Extension Placement

Put the extension file at:

```
~/.pi/agent/extensions/explabs-provider.ts
```

Pi auto-discovers extensions in `~/.pi/agent/extensions/` (global scope, all projects).

### Hot Reload

After placing the file, run `/reload` in pi to load it without restarting. Or restart pi normally — extensions load on startup.

---

## Implementation

### Extension File: `explabs-provider.ts`

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("experientiallabs", {
    name: "Experiential Labs",
    baseUrl: "https://api.experientiallabs.ai/v1",
    apiKey: "$EXPLABS_API_KEY", // env var reference
    api: "openai-completions",
    async refreshModels({ signal }) {
      const response = await fetch(
        "https://api.experientiallabs.ai/v1/models",
        { signal },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch models: ${response.status} ${response.statusText}`,
        );
      }
      const { data } = (await response.json()) as {
        data: Array<{
          id: string;
          name?: string;
          context_window?: number;
          max_tokens?: number;
          owned_by?: string;
        }>;
      };
      return data.map((model) => ({
        id: model.id,
        name: model.name ?? model.id,
        reasoning: false,
        input: ["text"] as ("text" | "image")[],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: model.context_window ?? 128000,
        maxTokens: model.max_tokens ?? 4096,
      }));
    },
  });
}
```

### What This Does

1. **Registers** `experientiallabs` as a provider in pi
2. **`refreshModels`** is called by pi whenever it needs to refresh the model list — including when the user opens `/model`
3. **Fetches** from the Experiential Labs `/v1/models` endpoint (standard OpenAI-compatible format)
4. **Maps** the response to pi's model definition format
5. **No persistence** — models are always fetched live, no stale cache

---

## Key Concepts

### `refreshModels` Callback

```typescript
async refreshModels({ signal }: { signal: AbortSignal }) {
  // Fetch models from the API
  // Return an array of model definitions
  // Use `signal` to abort fetch if the user cancels
}
```

Pi calls `refreshModels` during model refresh. The returned models replace any previously registered models for this provider. The `signal` is an `AbortSignal` — pass it to `fetch()` so pi can cancel if needed.

### Model Definition Fields

Each model returned from `refreshModels` should have:

| Field           | Type                                       | Required | Description                                       |
| --------------- | ------------------------------------------ | -------- | ------------------------------------------------- |
| `id`            | `string`                                   | Yes      | Model identifier (sent to the API)                |
| `name`          | `string`                                   | No       | Human-readable label (falls back to `id`)         |
| `reasoning`     | `boolean`                                  | Yes      | Whether the model supports extended thinking      |
| `input`         | `("text" \| "image")[]`                    | Yes      | Supported input types                             |
| `cost`          | `{ input, output, cacheRead, cacheWrite }` | Yes      | Per-million-token rates (set all to 0 if unknown) |
| `contextWindow` | `number`                                   | Yes      | Max context window in tokens                      |
| `maxTokens`     | `number`                                   | Yes      | Max output tokens                                 |

Additional optional fields (if the API provides them):

- `thinkingLevelMap` — for reasoning models with specific thinking level controls
- `compat` — provider compatibility overrides (e.g., `supportsDeveloperRole: false`)
- `headers` — custom headers per model
- `baseUrl` — per-model endpoint override

### API Key Handling

The `apiKey: "$EXPLABS_API_KEY"` syntax tells pi to read the API key from the `EXPLABS_API_KEY` environment variable. Users set this before launching pi:

```bash
export EXPLABS_API_KEY="their-api-key"
pi
```

Or use `/login experientiallabs` in pi to store the key interactively (if auth is configured).

### Supported API Types

For Experiential Labs (OpenAI-compatible endpoint), use `"openai-completions"`. Other options:

- `"openai-responses"` — OpenAI Responses API
- `"anthropic-messages"` — Anthropic Messages API
- `"google-generative-ai"` — Google Generative AI
- `"mistral-conversations"` — Mistral native API

---

## Compatibility Flags

If Experiential Labs' API has quirks compared to standard OpenAI, add `compat` at the provider or model level:

```typescript
pi.registerProvider("experientiallabs", {
  // ...
  compat: {
    supportsDeveloperRole: false, // Use "system" role instead of "developer"
    supportsReasoningEffort: false, // Don't send reasoning_effort parameter
    supportsUsageInStreaming: false, // Doesn't include usage stats in streaming
    maxTokensField: "max_tokens", // Use max_tokens instead of max_completion_tokens
  },
});
```

Common compat flags for OpenAI-compatible providers:

| Flag                       | Default                   | Description                                             |
| -------------------------- | ------------------------- | ------------------------------------------------------- |
| `supportsDeveloperRole`    | `true`                    | Use `developer` role (OpenAI) vs `system` (most others) |
| `supportsReasoningEffort`  | `true`                    | Support `reasoning_effort` parameter                    |
| `supportsUsageInStreaming` | `true`                    | Support `stream_options: { include_usage: true }`       |
| `supportsFinishReason`     | `true`                    | Stream includes `finish_reason`                         |
| `maxTokensField`           | `"max_completion_tokens"` | Which field for max tokens                              |

---

## Testing

### 1. Place the file

```bash
mkdir -p ~/.pi/agent/extensions
# Create ~/.pi/agent/extensions/explabs-provider.ts with the code above
```

### 2. Set the API key

```bash
export EXPLABS_API_KEY="your-key-here"
```

### 3. Start pi (or `/reload`)

```bash
pi
# Or in an existing session: /reload
```

### 4. Check model list

```bash
pi --list-models
```

The Experiential Labs models should appear in the list.

### 5. Select a model

In pi, open `/model` and select an Experiential Labs model. The model list is fetched fresh each time you open `/model`.

---

## Troubleshooting

### Models don't appear

- Check that `EXPLABS_API_KEY` is set
- Verify the API endpoint is reachable: `curl https://api.experientiallabs.ai/v1/models`
- Check pi's console output for errors
- Run `/reload` in pi to reload extensions

### Fetch errors

- The `refreshModels` callback receives a `signal` — pass it to `fetch()` so pi can cancel properly
- Always check `response.ok` before parsing JSON
- Throw errors with descriptive messages — pi displays them to the user

### API response format

The implementation assumes the standard OpenAI `/v1/models` response format:

```json
{
  "data": [
    {
      "id": "model-name",
      "name": "Model Display Name",
      "context_window": 128000,
      "max_tokens": 4096
    }
  ]
}
```

If Experiential Labs uses a different format, adjust the `refreshModels` parsing accordingly.

---

## Reference: Extension API

### `pi.registerProvider(name, config)`

Registers or overrides a model provider. Can be called during extension load or after startup.

**Config fields:**

| Field           | Type                                  | Description                                  |
| --------------- | ------------------------------------- | -------------------------------------------- |
| `name`          | `string`                              | Display name in UI                           |
| `baseUrl`       | `string`                              | API endpoint URL                             |
| `apiKey`        | `string`                              | API key (literal, `$ENV_VAR`, or `!command`) |
| `api`           | `string`                              | Streaming API type                           |
| `models`        | `ModelConfig[]`                       | Static model list                            |
| `refreshModels` | `async ({ signal }) => ModelConfig[]` | Dynamic model discovery                      |
| `headers`       | `Record<string, string>`              | Custom headers                               |
| `compat`        | `object`                              | Compatibility flags                          |
| `oauth`         | `object`                              | OAuth config for `/login`                    |

### `pi.unregisterProvider(name)`

Removes a previously registered provider and its models.

---

## Further Reading

- [Pi Extension Docs](https://github.com/earendil-works/pi-coding-agent/blob/main/docs/extensions.md)
- [Custom Provider Docs](https://github.com/earendil-works/pi-coding-agent/blob/main/docs/custom-provider.md)
- [Model Configuration](https://github.com/earendil-works/pi-coding-agent/blob/main/docs/models.md)
- [Example: GitLab Duo Provider](https://github.com/earendil-works/pi-coding-agent/blob/main/examples/extensions/custom-provider-gitlab-duo/index.ts)
