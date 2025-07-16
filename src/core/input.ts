import fs from 'node:fs/promises';
import getStdin from 'get-stdin';
import { record } from './terminal';
import type { SvgTermCli } from '../types';

export async function getInput(cli: SvgTermCli): Promise<string | null> {
  if (cli.flags.command) {
    return record(cli.flags.command);
  }

  if (cli.flags.in) {
    return await fs.readFile(cli.flags.in, 'utf-8');
  }

  if (cli.flags.cast) {
    const response = await fetch(
      `https://asciinema.org/a/${cli.flags.cast}.cast?dl=true`
    );
    return await response.text();
  }

  return getStdin();
}