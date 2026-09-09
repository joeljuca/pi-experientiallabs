/**
 * Tests for the Experiential Labs pi extension
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createExplabsExtension } from "./index.js";

const DEFAULT_BASE_URL = "https://api.experientiallabs.ai/v1";

function mockFetch() {
  const fn = vi.fn();
  vi.stubGlobal("fetch", fn);
  return fn;
}

function mockResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    statusText: "OK",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function mockPi() {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  return {
    on: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(event, handler);
    }),
    registerProvider: vi.fn(),
    _handler(event: string) {
      return handlers.get(event);
    },
  };
}

function mockCtx() {
  return { ui: { notify: vi.fn() } };
}

const ENV_VARS = [
  "EXPLABS_API_KEY",
  "EXPLABS_BASE_URL",
  "EXPLABS_API_FORMAT",
  "MY_CUSTOM_KEY",
] as const;

const ENV_BACKUP: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const name of ENV_VARS) {
    ENV_BACKUP[name] = process.env[name];
    // Start every test from a clean slate
    delete process.env[name];
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const name of ENV_VARS) {
    const value = ENV_BACKUP[name];
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

// ===========================================================================
// createExplabsExtension
// ===========================================================================

describe("createExplabsExtension", () => {
  it("returns a function", () => {
    expect(createExplabsExtension()).toBeInstanceOf(Function);
  });

  describe("config precedence: config param > env var > default", () => {
    it("uses defaults when nothing is provided", () => {
      const pi = mockPi();
      createExplabsExtension()(pi as never);

      expect(pi.registerProvider).toHaveBeenCalledWith(
        "explabs",
        expect.objectContaining({
          baseUrl: DEFAULT_BASE_URL,
          apiKey: "",
          authHeader: true,
          api: "openai-completions",
        }),
      );
    });

    it("reads EXPLABS_API_KEY env var", () => {
      process.env.EXPLABS_API_KEY = "xpl_abc123def456abc123def456abc123def456";
      const pi = mockPi();
      createExplabsExtension()(pi as never);

      expect(pi.registerProvider).toHaveBeenCalledWith(
        "explabs",
        expect.objectContaining({
          apiKey: "xpl_abc123def456abc123def456abc123def456",
        }),
      );
    });

    it("reads EXPLABS_BASE_URL env var", () => {
      process.env.EXPLABS_BASE_URL = "https://selfhosted.example.com/v1";
      const pi = mockPi();
      createExplabsExtension()(pi as never);

      expect(pi.registerProvider).toHaveBeenCalledWith(
        "explabs",
        expect.objectContaining({
          baseUrl: "https://selfhosted.example.com/v1",
        }),
      );
    });

    it("reads EXPLABS_API_FORMAT env var", () => {
      process.env.EXPLABS_API_FORMAT = "anthropic-messages";
      const pi = mockPi();
      createExplabsExtension()(pi as never);

      expect(pi.registerProvider).toHaveBeenCalledWith(
        "explabs",
        expect.objectContaining({ api: "anthropic-messages" }),
      );
    });

    it("config param overrides baseUrl env var", () => {
      process.env.EXPLABS_BASE_URL = "https://env.example.com/v1";
      const pi = mockPi();
      createExplabsExtension({ baseUrl: "https://config.example.com/v1" })(pi as never);

      expect(pi.registerProvider).toHaveBeenCalledWith(
        "explabs",
        expect.objectContaining({
          baseUrl: "https://config.example.com/v1",
        }),
      );
    });

    it("config param overrides apiFormat env var", () => {
      process.env.EXPLABS_API_FORMAT = "openai-completions";
      const pi = mockPi();
      createExplabsExtension({ apiFormat: "anthropic-messages" })(pi as never);

      expect(pi.registerProvider).toHaveBeenCalledWith(
        "explabs",
        expect.objectContaining({ api: "anthropic-messages" }),
      );
    });

    it("config param apiKeyEnv selects a custom env var", () => {
      process.env.MY_CUSTOM_KEY = "custom_key_value";
      const pi = mockPi();
      createExplabsExtension({ apiKeyEnv: "MY_CUSTOM_KEY" })(pi as never);

      expect(pi.registerProvider).toHaveBeenCalledWith(
        "explabs",
        expect.objectContaining({ apiKey: "custom_key_value" }),
      );
    });

    it("throws on invalid apiFormat in config", () => {
      // @ts-expect-error – testing invalid value at runtime
      expect(() => createExplabsExtension({ apiFormat: "bogus-format" })).toThrow(
        /Invalid apiFormat/,
      );
    });

    it("throws on invalid EXPLABS_API_FORMAT env var", () => {
      process.env.EXPLABS_API_FORMAT = "bogus-format";
      expect(() => createExplabsExtension()).toThrow(/Invalid EXPLABS_API_FORMAT/);
    });
  });
});

// ===========================================================================
// Extension function (pi integration)
// ===========================================================================

describe("extension function", () => {
  it("registers the provider with name 'explabs'", () => {
    const pi = mockPi();
    createExplabsExtension()(pi as never);

    expect(pi.registerProvider).toHaveBeenCalledWith("explabs", expect.any(Object));
  });

  it("registers an input listener", () => {
    const pi = mockPi();
    createExplabsExtension()(pi as never);

    expect(pi.on).toHaveBeenCalledWith("input", expect.any(Function));
  });

  describe("/login explabs interception", () => {
    it("returns { action: 'handled' } and shows a notification", async () => {
      const pi = mockPi();
      createExplabsExtension()(pi as never);

      const handler = pi._handler("input");
      const ctx = mockCtx();
      const result = await handler!({ text: "/login explabs" }, ctx);

      expect(result).toEqual({ action: "handled" });
      expect(ctx.ui.notify).toHaveBeenCalledWith(expect.stringContaining("API key"), "info");
    });

    it("returns { action: 'continue' } for other inputs", async () => {
      const pi = mockPi();
      createExplabsExtension()(pi as never);

      const handler = pi._handler("input");
      const ctx = mockCtx();
      const result = await handler!({ text: "/model" }, ctx);

      expect(result).toEqual({ action: "continue" });
      expect(ctx.ui.notify).not.toHaveBeenCalled();
    });
  });
});

// ===========================================================================
// refreshModels
// ===========================================================================

describe("refreshModels", () => {
  let fetch: ReturnType<typeof mockFetch>;
  let pi: ReturnType<typeof mockPi>;
  let provider: Record<string, unknown>;

  beforeEach(() => {
    fetch = mockFetch();
    pi = mockPi();
    createExplabsExtension()(pi as never);
    provider = pi.registerProvider.mock.calls[0][1];
  });

  it("fetches from {baseUrl}/models", async () => {
    fetch.mockResolvedValue(mockResponse({ data: [] }));

    await provider.refreshModels({ signal: new AbortController().signal });

    expect(fetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/models`,
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it("sends the Authorization header", async () => {
    process.env.EXPLABS_API_KEY = "xpl_my_test_key";
    fetch.mockResolvedValue(mockResponse({ data: [] }));

    await provider.refreshModels({ signal: new AbortController().signal });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer xpl_my_test_key",
        }),
      }),
    );
  });

  it("passes the abort signal", async () => {
    const signal = new AbortController().signal;
    fetch.mockResolvedValue(mockResponse({ data: [] }));

    await provider.refreshModels({ signal });

    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal }));
  });

  it("maps models from the response", async () => {
    fetch.mockResolvedValue(
      mockResponse({
        data: [{ id: "aion-2.0", object: "model", created: 0, owned_by: "exp" }],
      }),
    );

    const models = await provider.refreshModels({
      signal: new AbortController().signal,
    });

    expect(models).toEqual([
      {
        id: "aion-2.0",
        name: "aion-2.0",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128_000,
        maxTokens: 4096,
      },
    ]);
  });

  it("uses model.name when available", async () => {
    fetch.mockResolvedValue(
      mockResponse({
        data: [
          {
            id: "aion-2.0",
            name: "Aion 2.0",
            object: "model",
            owned_by: "exp",
          },
        ],
      }),
    );

    const models = await provider.refreshModels({
      signal: new AbortController().signal,
    });

    expect(models[0].name).toBe("Aion 2.0");
  });

  it("uses model.context_window and model.max_tokens when available", async () => {
    fetch.mockResolvedValue(
      mockResponse({
        data: [
          {
            id: "aion-2.0",
            context_window: 200_000,
            max_tokens: 16_384,
            owned_by: "exp",
          },
        ],
      }),
    );

    const models = await provider.refreshModels({
      signal: new AbortController().signal,
    });

    expect(models[0]).toMatchObject({
      contextWindow: 200_000,
      maxTokens: 16_384,
    });
  });

  it("throws on non-ok response", async () => {
    fetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: "A valid gateway Bearer key is required.",
            type: "authentication_error",
            code: "invalid_key",
          },
        }),
        {
          status: 401,
          statusText: "Unauthorized",
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(provider.refreshModels({ signal: new AbortController().signal })).rejects.toThrow(
      /Failed to fetch Experiential Labs models/,
    );
  });

  it("throws when response body lacks data array", async () => {
    fetch.mockResolvedValue(mockResponse({ error: "not found" }));

    await expect(provider.refreshModels({ signal: new AbortController().signal })).rejects.toThrow(
      /Invalid response format/,
    );
  });
});
