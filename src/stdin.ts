// src/stdin.ts
import type { StdinData } from './types.js';

export function parseStdinData(raw: string): StdinData | null {
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as StdinData;
  } catch {
    return null;
  }
}

export async function readStdin(): Promise<StdinData | null> {
  if (process.stdin.isTTY) {
    return null;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const input = Buffer.concat(chunks).toString('utf8').trim();
  if (!input) {
    return null;
  }

  try {
    return JSON.parse(input) as StdinData;
  } catch {
    return null;
  }
}

export function getModelName(stdin: Partial<StdinData>): string {
  return stdin.model?.display_name ?? stdin.model?.id ?? 'unknown';
}

export function getProjectPath(stdin: Partial<StdinData>, depth: number): string {
  const dir = stdin.workspace?.current_dir ?? stdin.cwd ?? '';
  if (!dir || depth < 1) return '';
  // Split by both Unix (/) and Windows (\) separators (like claude-hud)
  const segments = dir.split(/[/\\]/).filter(Boolean);
  const sliced = segments.slice(-Math.min(depth, segments.length));
  return sliced.join('/');
}

export interface CostInfo {
  totalCostUsd: number | null;
  totalDurationMs: number | null;
  totalApiDurationMs: number | null;
  totalLinesAdded: number | null;
  totalLinesRemoved: number | null;
}

export function getCost(stdin: Partial<StdinData>): CostInfo {
  const cost = stdin.cost;
  return {
    totalCostUsd: cost?.total_cost_usd ?? null,
    totalDurationMs: cost?.total_duration_ms ?? null,
    totalApiDurationMs: cost?.total_api_duration_ms ?? null,
    totalLinesAdded: cost?.total_lines_added ?? null,
    totalLinesRemoved: cost?.total_lines_removed ?? null,
  };
}

export interface ContextWindowInfo {
  totalInputTokens: number | null;
  totalOutputTokens: number | null;
  contextWindowSize: number | null;
  currentInputTokens: number | null;
  currentOutputTokens: number | null;
  // 当前上下文实际占用的 token 数 = input_tokens + cache_creation + cache_read
  // （新版 CLI 的 current_usage.input_tokens 恒为 0，真实用量都在 cache 字段里）
  currentContextTokens: number | null;
  cacheCreationTokens: number | null;
  cacheReadTokens: number | null;
  usedPercentage: number | null;
  remainingPercentage: number | null;
}

export function getContextWindow(stdin: Partial<StdinData>): ContextWindowInfo {
  const cw = stdin.context_window;
  const currentUsage = cw?.current_usage;
  const currentParts = [
    currentUsage?.input_tokens,
    currentUsage?.cache_creation_input_tokens,
    currentUsage?.cache_read_input_tokens,
  ].filter((v): v is number => typeof v === 'number');
  return {
    totalInputTokens: cw?.total_input_tokens ?? null,
    totalOutputTokens: cw?.total_output_tokens ?? null,
    contextWindowSize: cw?.context_window_size ?? null,
    currentInputTokens: currentUsage?.input_tokens ?? null,
    currentOutputTokens: currentUsage?.output_tokens ?? null,
    currentContextTokens: currentParts.length > 0 ? currentParts.reduce((a, b) => a + b, 0) : null,
    cacheCreationTokens: currentUsage?.cache_creation_input_tokens ?? null,
    cacheReadTokens: currentUsage?.cache_read_input_tokens ?? null,
    usedPercentage: cw?.used_percentage ?? null,
    remainingPercentage: cw?.remaining_percentage ?? null,
  };
}

export function getVersion(stdin: Partial<StdinData>): string | null {
  return stdin.version ?? null;
}
