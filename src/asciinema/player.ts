import { AsciinemaError, AsciinemaErrorType } from './errors';
import type { ParsedCast, PlayOptions } from '../types';

export interface CastPlayer {
  play(castData: ParsedCast, options?: PlayOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
}

export class DefaultCastPlayer implements CastPlayer {
  private isPlaying = false;
  private isPaused = false;
  private currentTimeout?: NodeJS.Timeout;

  async play(castData: ParsedCast, options: PlayOptions = {}): Promise<void> {
    if (this.isPlaying) {
      throw new AsciinemaError(
        AsciinemaErrorType.PLAYBACK_FAILED,
        'Player is already playing'
      );
    }

    this.isPlaying = true;
    this.isPaused = false;

    const speed = options.speed || 1;
    const idleTimeLimit = options.idle_time_limit;

    try {
      // Clear screen and move cursor to top-left
      process.stdout.write('\x1b[2J\x1b[H');

      for (let i = 0; i < castData.events.length; i++) {
        if (!this.isPlaying) {
          break;
        }

        // Wait if paused
        while (this.isPaused && this.isPlaying) {
          await this.sleep(100);
        }

        const event = castData.events[i];
        const nextEvent = castData.events[i + 1];

        // Output the event data
        if (event.type === 'o') {
          process.stdout.write(event.data);
        }

        // Calculate delay until next event
        if (nextEvent && this.isPlaying) {
          let delay = (nextEvent.time - event.time) * 1000 / speed;
          
          // Apply idle time limit if specified
          if (idleTimeLimit && delay > idleTimeLimit * 1000) {
            delay = idleTimeLimit * 1000;
          }

          if (delay > 0) {
            await this.sleep(delay);
          }
        }
      }
    } catch (error) {
      throw new AsciinemaError(
        AsciinemaErrorType.PLAYBACK_FAILED,
        `Playback failed: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    } finally {
      this.isPlaying = false;
      this.isPaused = false;
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = undefined;
      }
    }
  }

  pause(): void {
    if (this.isPlaying && !this.isPaused) {
      this.isPaused = true;
    }
  }

  resume(): void {
    if (this.isPlaying && this.isPaused) {
      this.isPaused = false;
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = undefined;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.currentTimeout = setTimeout(resolve, ms);
    });
  }
}