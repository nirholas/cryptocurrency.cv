/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock pino before importing logger so we can inspect calls
const mockChild = vi.fn().mockReturnValue({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
  child: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
  }),
});

const mockPino = vi.fn().mockReturnValue({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
  child: mockChild,
});

// Attach stdSerializers to the mock
mockPino.stdSerializers = {
  err: vi.fn(),
  req: vi.fn(),
  res: vi.fn(),
};

vi.mock("pino", () => ({
  default: mockPino,
}));

describe("Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create logger with correct base fields", async () => {
    // Re-import to trigger the pino() call
    vi.resetModules();
    vi.doMock("pino", () => ({ default: mockPino }));
    await import("@/lib/logger");

    expect(mockPino).toHaveBeenCalledWith(
      expect.objectContaining({
        base: expect.objectContaining({
          service: "free-crypto-news",
          env: expect.any(String),
        }),
      }),
    );
  });

  it("should redact sensitive fields", async () => {
    vi.resetModules();
    vi.doMock("pino", () => ({ default: mockPino }));
    await import("@/lib/logger");

    const pinoConfig = mockPino.mock.calls[0][0];
    expect(pinoConfig.redact).toBeDefined();
    expect(pinoConfig.redact.paths).toContain("req.headers.authorization");
    expect(pinoConfig.redact.paths).toContain("req.headers.cookie");
    expect(pinoConfig.redact.paths).toContain("apiKey");
    expect(pinoConfig.redact.paths).toContain("password");
    expect(pinoConfig.redact.paths).toContain("token");
    expect(pinoConfig.redact.paths).toContain("secret");
    expect(pinoConfig.redact.paths).toContain("DATABASE_URL");
    expect(pinoConfig.redact.paths).toContain("REDIS_URL");
    expect(pinoConfig.redact.censor).toBe("[REDACTED]");
  });

  it("should create child loggers with module field", async () => {
    vi.resetModules();
    vi.doMock("pino", () => ({ default: mockPino }));
    const loggerModule = await import("@/lib/logger");

    // The module creates child loggers during initialization
    expect(mockChild).toHaveBeenCalledWith({ module: "api" });
    expect(mockChild).toHaveBeenCalledWith({ module: "cache" });
    expect(mockChild).toHaveBeenCalledWith({ module: "database" });
    expect(mockChild).toHaveBeenCalledWith({ module: "websocket" });
    expect(mockChild).toHaveBeenCalledWith({ module: "auth" });
    expect(mockChild).toHaveBeenCalledWith({ module: "rate-limit" });
    expect(mockChild).toHaveBeenCalledWith({ module: "ai" });
    expect(mockChild).toHaveBeenCalledWith({ module: "archive" });

    // Verify exports exist
    expect(loggerModule.apiLogger).toBeDefined();
    expect(loggerModule.cacheLogger).toBeDefined();
    expect(loggerModule.dbLogger).toBeDefined();
    expect(loggerModule.wsLogger).toBeDefined();
    expect(loggerModule.authLogger).toBeDefined();
    expect(loggerModule.rateLimitLogger).toBeDefined();
    expect(loggerModule.aiLogger).toBeDefined();
    expect(loggerModule.archiveLogger).toBeDefined();
  });

  it("should use pino-pretty in development", async () => {
    vi.resetModules();
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    vi.doMock("pino", () => ({ default: mockPino }));
    await import("@/lib/logger");

    const pinoConfig = mockPino.mock.calls[0][0];
    expect(pinoConfig.transport).toEqual({
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard" },
    });

    process.env.NODE_ENV = prevEnv;
  });

  it("should output JSON in production", async () => {
    vi.resetModules();
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    vi.doMock("pino", () => ({ default: mockPino }));
    await import("@/lib/logger");

    const pinoConfig = mockPino.mock.calls[0][0];
    expect(pinoConfig.transport).toBeUndefined();
    expect(pinoConfig.level).toBe("info");

    process.env.NODE_ENV = prevEnv;
  });

  it("should respect LOG_LEVEL environment variable", async () => {
    vi.resetModules();
    const prevLogLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = "warn";
    vi.doMock("pino", () => ({ default: mockPino }));
    await import("@/lib/logger");

    const pinoConfig = mockPino.mock.calls[0][0];
    expect(pinoConfig.level).toBe("warn");

    process.env.LOG_LEVEL = prevLogLevel;
  });

  it("createRequestLogger should return object with logging methods", async () => {
    vi.resetModules();
    vi.doMock("pino", () => ({ default: mockPino }));
    const { createRequestLogger } = await import("@/lib/logger");

    const mockReq = {
      method: "GET",
      nextUrl: { pathname: "/api/news", search: "" },
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
    } as any;

    const reqLogger = createRequestLogger(mockReq);
    expect(reqLogger.info).toBeInstanceOf(Function);
    expect(reqLogger.error).toBeInstanceOf(Function);
    expect(reqLogger.warn).toBeInstanceOf(Function);
    expect(reqLogger.debug).toBeInstanceOf(Function);
    expect(reqLogger.request).toBeInstanceOf(Function);
  });

  it("createLogger should return legacy-compatible logger", async () => {
    vi.resetModules();
    vi.doMock("pino", () => ({ default: mockPino }));
    const { createLogger } = await import("@/lib/logger");

    const moduleLogger = createLogger("TestModule");
    expect(moduleLogger.info).toBeInstanceOf(Function);
    expect(moduleLogger.error).toBeInstanceOf(Function);
    expect(moduleLogger.warn).toBeInstanceOf(Function);
    expect(moduleLogger.debug).toBeInstanceOf(Function);
  });
});
