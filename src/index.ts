/**
 * Experiential Labs provider extension for pi coding agent
 *
 * Registers Experiential Labs as a model provider with dynamic model discovery.
 * Models are fetched from the Experiential Labs API whenever pi refreshes the model list.
 *
 * @packageDocumentation
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import Debug from "debug";

const debug = Debug("pi-experientiallabs");

/** Supported API formats for Experiential Labs */
type ApiFormat =
  "openai-completions" | "openai-responses" | "anthropic-messages";

/** Allowed values for API format */
const API_FORMATS: readonly ApiFormat[] = [
  "openai-completions",
  "openai-responses",
  "anthropic-messages",
];

/** Configuration for the Experiential Labs API */
interface ExperientialLabsConfig {
  /** Base URL for the API (default: reads from EXPLABS_BASE_URL env var, falls back to https://api.experientiallabs.ai/v1) */
  baseUrl?: string;
  /** Environment variable name for the API key (default: EXPLABS_API_KEY) */
  apiKeyEnv?: string;
  /** API format to use (default: reads from EXPLABS_API_FORMAT env var, falls back to openai-completions) */
  apiFormat?: ApiFormat;
}

/** Model data from the Experiential Labs API */
interface ExperientialLabsModel {
  id: string;
  name?: string;
  context_window?: number;
  max_tokens?: number;
  owned_by?: string;
  /** Additional fields from the API */
  [key: string]: unknown;
}

/** API response format for /v1/models */
interface ModelsResponse {
  data: ExperientialLabsModel[];
}

/** Default configuration */
const DEFAULT_CONFIG: Required<
  Omit<ExperientialLabsConfig, "apiFormat" | "baseUrl">
> = {
  apiKeyEnv: "EXPLABS_API_KEY",
};

const DEFAULT_BASE_URL = "https://api.experientiallabs.ai/v1";

/**
 * Validates and returns the API format from env var or config
 */
function resolveApiFormat(config?: ApiFormat): ApiFormat {
  // Config takes precedence
  if (config) {
    if (!API_FORMATS.includes(config)) {
      throw new Error(
        `Invalid apiFormat: "${config}". Must be one of: ${API_FORMATS.join(", ")}`,
      );
    }
    return config;
  }

  // Fall back to env var
  const envValue = process.env.EXPLABS_API_FORMAT;

  if (envValue) {
    if (!API_FORMATS.includes(envValue as ApiFormat)) {
      throw new Error(
        `Invalid EXPLABS_API_FORMAT: "${envValue}". Must be one of: ${API_FORMATS.join(", ")}`,
      );
    }
    return envValue as ApiFormat;
  }

  // Default
  return "openai-completions";
}

/**
 * Creates the Experiential Labs provider extension
 *
 * @param config - Optional configuration overrides
 * @returns Extension factory function for pi
 *
 * @example
 * ```typescript
 * import explabsProvider from "@joeljuca/pi-experientiallabs";
 *
 * // Default: openai-completions
 * export default explabsProvider();
 *
 * // Explicit format
 * export default explabsProvider({ apiFormat: "anthropic-messages" });
 * ```
 */
export function createExplabsExtension(config?: ExperientialLabsConfig) {
  const baseUrl =
    config?.baseUrl ?? process.env.EXPLABS_BASE_URL ?? DEFAULT_BASE_URL;
  const apiKeyEnv = config?.apiKeyEnv ?? DEFAULT_CONFIG.apiKeyEnv;
  const apiFormat = resolveApiFormat(config?.apiFormat);

  debug(
    "config: baseUrl=%s apiKeyEnv=%s apiFormat=%s",
    baseUrl,
    apiKeyEnv,
    apiFormat,
  );

  return function explabsExtension(pi: ExtensionAPI): void {
    pi.registerProvider("experientiallabs", {
      name: "Experiential Labs",
      baseUrl,
      apiKey: process.env[apiKeyEnv] ?? "",
      authHeader: true,
      api: apiFormat,

      async refreshModels({ signal }: { signal: AbortSignal }) {
        const modelsUrl = `${baseUrl}/models`;
        debug("fetching models from %s", modelsUrl);

        const response = await fetch(modelsUrl, {
          signal,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${process.env[apiKeyEnv] ?? ""}`,
          },
        });

        debug("response status: %d", response.status);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          debug("error: %s", errorText);
          throw new Error(
            `Failed to fetch Experiential Labs models: ${response.status} ${response.statusText}\n${errorText}`,
          );
        }

        const payload = (await response.json()) as ModelsResponse;
        debug("received %d models", payload.data?.length ?? 0);

        if (!Array.isArray(payload.data)) {
          debug("invalid payload: %o", payload);
          throw new Error(
            "Invalid response format: expected 'data' to be an array",
          );
        }

        return payload.data.map((model) => ({
          id: model.id,
          name: model.name ?? model.id,
          reasoning: false,
          input: ["text"] as ("text" | "image")[],
          cost: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
          },
          contextWindow: model.context_window ?? 128_000,
          maxTokens: model.max_tokens ?? 4096,
        }));
      },
    });
  };
}

/**
 * Default extension factory
 *
 * Reads configuration from environment variables:
 * - `EXPLABS_API_KEY`: API key (required)
 * - `EXPLABS_BASE_URL`: API endpoint URL (default: "https://api.experientiallabs.ai/v1")
 * - `EXPLABS_API_FORMAT`: API format - "openai-completions", "openai-responses", or "anthropic-messages" (default: "openai-completions")
 */
export default createExplabsExtension();
