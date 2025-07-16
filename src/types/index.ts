// Core types
export interface Guesses {
  [key: string]: string | null;
}

export interface SvgTermCli {
  flags: { [name: string]: any };
  help: string;
  input: string[];
}

export interface SvgTermError extends Error {
  help(): string;
}

// Asciinema types
export interface CastHeader {
  version: number;
  width: number;
  height: number;
  timestamp?: number;
  duration?: number;
  idle_time_limit?: number;
  command?: string;
  title?: string;
  env?: Record<string, string>;
}

export interface CastEvent {
  time: number;
  type: 'o' | 'i';
  data: string;
}

export interface ParsedCast {
  header: CastHeader;
  events: CastEvent[];
  format: 'v1' | 'v2';
}

export interface NormalizedCastData {
  metadata: {
    version: number;
    width: number;
    height: number;
    duration?: number;
    title?: string;
    timestamp?: number;
    command?: string;
  };
  timeline: Array<{
    time: number;
    type: 'output' | 'input';
    content: string;
  }>;
}

// Player types
export interface PlayOptions {
  speed?: number;
  idle_time_limit?: number;
  pause_on_markers?: boolean;
}

// Batch processing types
export interface BatchOptions {
  inputDir: string;
  outputDir?: string;
  pattern?: string;
  parallel?: number;
  skipErrors?: boolean;
}

export interface BatchResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{file: string, error: string}>;
}

// Clipboard types
export interface ClipboardOptions {
  format?: 'svg' | 'base64' | 'dataurl';
  notification?: boolean;
  fallback?: boolean;
}

export interface ClipboardSystemInfo {
  platform: string;
  hasClipboard: boolean;
  supportedFormats: string[];
}