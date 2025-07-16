import { execa } from 'execa';
import { temporaryFile } from 'tempy';
import fs from 'node:fs/promises';
import commandExists from 'command-exists';
import { AsciinemaError, AsciinemaErrorType } from './errors';

export interface RecordOptions {
  command?: string;
  title?: string;
  output?: string;
  overwrite?: boolean;
  append?: boolean;
  idle_time_limit?: number;
  yes?: boolean;
  quiet?: boolean;
}

export interface AsciinemaRecorder {
  record(options: RecordOptions): Promise<string>;
  isAsciinemaInstalled(): Promise<boolean>;
  getAsciinemaVersion(): Promise<string>;
}

export class DefaultAsciinemaRecorder implements AsciinemaRecorder {
  async record(options: RecordOptions): Promise<string> {
    if (!(await this.isAsciinemaInstalled())) {
      throw new AsciinemaError(
        AsciinemaErrorType.NOT_INSTALLED,
        'asciinema is not installed. Please install it from https://asciinema.org/docs/installation'
      );
    }

    const outputFile = options.output || temporaryFile({ extension: '.cast' });
    
    const args = ['rec'];
    
    if (options.command) {
      args.push('-c', options.command);
    }
    
    if (options.title) {
      args.push('-t', options.title);
    }
    
    if (options.overwrite) {
      args.push('--overwrite');
    }
    
    if (options.append) {
      args.push('--append');
    }
    
    if (options.idle_time_limit) {
      args.push('-i', options.idle_time_limit.toString());
    }
    
    if (options.yes) {
      args.push('-y');
    }
    
    if (options.quiet) {
      args.push('-q');
    }
    
    args.push(outputFile);

    try {
      const result = await execa('asciinema', args);
      
      if ((result.exitCode ?? 0) > 0) {
        throw new AsciinemaError(
          AsciinemaErrorType.RECORDING_FAILED,
          `Recording failed: ${result.stderr || result.stdout}`,
          { exitCode: result.exitCode, stderr: result.stderr, stdout: result.stdout }
        );
      }

      return await fs.readFile(outputFile, 'utf-8');
    } catch (error) {
      if (error instanceof AsciinemaError) {
        throw error;
      }
      
      throw new AsciinemaError(
        AsciinemaErrorType.RECORDING_FAILED,
        `Recording failed: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  async isAsciinemaInstalled(): Promise<boolean> {
    try {
      return (await commandExists('asciinema')) === 'asciinema';
    } catch {
      return false;
    }
  }

  async getAsciinemaVersion(): Promise<string> {
    try {
      const result = await execa('asciinema', ['--version']);
      return result.stdout.trim();
    } catch (error) {
      throw new AsciinemaError(
        AsciinemaErrorType.NOT_INSTALLED,
        'Failed to get asciinema version',
        error
      );
    }
  }
}