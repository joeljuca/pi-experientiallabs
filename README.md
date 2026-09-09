# @joeljuca/pi-experientiallabs

[![npm version](https://img.shields.io/npm/v/@joeljuca/pi-experientiallabs.svg?logo=npm)](https://www.npmjs.com/package/@joeljuca/pi-experientiallabs)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?logo=apache)](https://opensource.org/licenses/Apache-2.0)
[![GitHub](https://img.shields.io/badge/joeljuca/pi--experientiallabs-black?logo=github)](https://github.com/joeljuca/pi-experientiallabs)
[![Author](https://img.shields.io/badge/joeljuca.com-white?logo=google-chrome)](https://joeljuca.com)

[Experiential Labs](https://experientiallabs.ai) provider extension for the [pi coding agent](https://github.com/earendil-works/pi-coding-agent), featuring **dynamic model discovery** — models are fetched from the Experiential Labs API whenever pi refreshes the model list.

## Features

- 🔍 **Dynamic model discovery** — models are fetched live from the Experiential Labs API
- 🔄 **Auto-refresh** — model list updates when you open `/model` in pi
- 🛠️ **Zero configuration** — just set your API key and go
- 🔌 **Multiple API formats** — supports Chat Completions, Responses, and Anthropic Messages APIs

## Installation

```bash
# Using pi's package manager (recommended)
pi install npm:@joeljuca/pi-experientiallabs

# Or using npm directly
npm install -g @joeljuca/pi-experientiallabs
```

## Setup

### 1. Get your API key

Sign up at [experientiallabs.ai](https://experientiallabs.ai) to get your API key.

### 2. Set the environment variables

```bash
export EXPLABS_API_KEY="your-api-key-here"
```

Add this to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) to make it persistent.

### 3. Start pi

```bash
pi
```

### 4. Select a model

Open `/model` in pi and select an Experiential Labs model. The model list is fetched fresh each time you open `/model`.

## Configuration

### Default behavior

By default, the extension:

- Fetches models from `https://api.experientiallabs.ai/v1/models`
- Reads the API key from the `EXPLABS_API_KEY` environment variable
- Uses the OpenAI Chat Completions API format

### API format

Experiential Labs supports three API formats. Configure via environment variable:

```bash
# OpenAI Chat Completions (default)
export EXPLABS_API_FORMAT=openai-completions

# OpenAI Responses
export EXPLABS_API_FORMAT=openai-responses

# Anthropic Messages
export EXPLABS_API_FORMAT=anthropic-messages
```

Or pass directly in the config:

```typescript
createExplabsExtension({ apiFormat: "anthropic-messages" });
```

### Custom configuration

If you need to customize the behavior, use the `createExplabsExtension` factory:

```typescript
// ~/.pi/agent/extensions/custom-explabs.ts
import { createExplabsExtension } from "@joeljuca/pi-experientiallabs";

export default createExplabsExtension({
  baseUrl: "https://your-custom-endpoint.com/v1",
  apiKeyEnv: "MY_CUSTOM_API_KEY",
  apiFormat: "openai-responses",
});
```

### Configuration options

| Option      | Type        | Default                                                    | Description                               |
| ----------- | ----------- | ---------------------------------------------------------- | ----------------------------------------- |
| `baseUrl`   | `string`    | `EXPLABS_BASE_URL` or `https://api.experientiallabs.ai/v1` | API endpoint URL                          |
| `apiKeyEnv` | `string`    | `EXPLABS_API_KEY`                                          | Environment variable name for the API key |
| `apiFormat` | `ApiFormat` | `EXPLABS_API_FORMAT` or `openai-completions`               | API wire format to use                    |

## How it works

1. **Registration**: The extension registers `experientiallabs` as a model provider in pi
2. **Dynamic discovery**: When pi needs to refresh the model list (e.g., when you open `/model`), it calls the `refreshModels` callback
3. **API fetch**: The callback fetches models from the Experiential Labs `/v1/models` endpoint
4. **Model mapping**: The response is mapped to pi's model definition format
5. **Live updates**: No caching — models are always fetched fresh from the API

## Model definition fields

Each model returned from the API is mapped to pi's model definition format:

| Field           | Source                 | Default               |
| --------------- | ---------------------- | --------------------- |
| `id`            | `model.id`             | —                     |
| `name`          | `model.name`           | Falls back to `id`    |
| `reasoning`     | —                      | `false`               |
| `input`         | —                      | `["text"]`            |
| `cost`          | —                      | All zeros (free tier) |
| `contextWindow` | `model.context_window` | `128000`              |
| `maxTokens`     | `model.max_tokens`     | `4096`                |

## Troubleshooting

### Models don't appear

1. **Check your API key**:

   ```bash
   echo $EXPLABS_API_KEY
   ```

2. **Verify the API is reachable**:

   ```bash
   curl https://api.experientiallabs.ai/v1/models \
     -H "Authorization: Bearer $EXPLABS_API_KEY"
   ```

3. **Check pi's console output** for error messages

4. **Reload pi**:
   ```
   /reload
   ```

### Fetch errors

- Ensure your API key is valid and has not expired
- Check your network connection
- Verify the API endpoint is correct

### API response format

The extension expects the standard OpenAI `/v1/models` response format:

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

If Experiential Labs uses a different format, please [open an issue](https://github.com/joeljuca/pi-experientiallabs/issues).

## Development

### Prerequisites

- Node.js 18+
- pnpm, npm, or yarn

### Setup

```bash
git clone https://github.com/joeljuca/pi-experientiallabs.git
cd pi-experientiallabs
npm install
```

### Build

```bash
npm run build
```

### Watch mode

```bash
npm run dev
```

### Type checking

```bash
npm run typecheck
```

### Test locally

```bash
# Link the package globally
npm link

# Install in pi
pi install npm:@joeljuca/pi-experientiallabs

# Or test without installing
pi -e npm:@joeljuca/pi-experientiallabs
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

Apache-2.0 © [Joel Jucá](https://joeljuca.com)

## Links

- [Experiential Labs](https://experientiallabs.ai)
- [Pi Coding Agent](https://github.com/earendil-works/pi-coding-agent)
- [npm package](https://www.npmjs.com/package/@joeljuca/pi-experientiallabs)
- [GitHub repository](https://github.com/joeljuca/pi-experientiallabs)
