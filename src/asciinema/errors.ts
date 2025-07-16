export enum AsciinemaErrorType {
  NOT_INSTALLED = 'ASCIINEMA_NOT_INSTALLED',
  INVALID_CAST_FORMAT = 'INVALID_CAST_FORMAT',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  RECORDING_FAILED = 'RECORDING_FAILED',
  PLAYBACK_FAILED = 'PLAYBACK_FAILED',
  BATCH_PROCESSING_FAILED = 'BATCH_PROCESSING_FAILED',
  CLIPBOARD_FAILED = 'CLIPBOARD_FAILED',
  PARSING_FAILED = 'PARSING_FAILED'
}

export class AsciinemaError extends Error {
  constructor(
    public type: AsciinemaErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AsciinemaError';
  }

  toString(): string {
    return `${this.name} [${this.type}]: ${this.message}`;
  }
}