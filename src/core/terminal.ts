import { execa } from 'execa';
import { temporaryFile } from 'tempy';
import fs from 'node:fs/promises';
import commandExists from 'command-exists';

export interface RecordOptions {
  title?: string;
}

export async function command(name: string): Promise<boolean> {
  try {
    return (await commandExists(name)) === name;
  } catch {
    return false;
  }
}

export async function record(
  cmd: string,
  options: RecordOptions = {}
): Promise<string> {
  const tmp = temporaryFile({ extension: '.json' });

  const result = await execa('asciinema', [
    'rec',
    '-c',
    cmd,
    ...(options.title ? ['-t', options.title] : []),
    tmp,
  ]);

  if ((result.exitCode ?? 0) > 0) {
    throw new Error(
      `recording "${cmd}" failed\n${result.stdout}\n${result.stderr}`
    );
  }

  return await fs.readFile(tmp, 'utf-8');
}