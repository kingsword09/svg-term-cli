#!/usr/bin/env node
import chalk from 'chalk';
import { execa } from 'execa';
import { GuessedTerminal, guessTerminal } from 'guess-terminal';
import * as macosAppConfig from 'macos-app-config';
import os from 'node:os';
import path from 'node:path';
import { temporaryFile } from 'tempy';
import * as parsers from 'term-schemes';

import commandExists from 'command-exists';
import { Command } from 'commander';
import plist from 'plist';
import getStdin from 'get-stdin';
import { render } from 'svg-term';
import fs from 'node:fs/promises';
import { optimize } from 'svgo';

interface Guesses {
  [key: string]: string | null;
}

interface SvgTermCli {
  flags: { [name: string]: any };
  help: string;
  input: string[];
}

interface SvgTermError extends Error {
  help(): string;
}

interface RecordOptions {
  title?: string;
}

withCli(
  main,
  `
  Usage
    $ svg-term [options]

  Options
    --at            timestamp of frame to render in ms [number]
    --cast          asciinema cast id to download [string], required if no stdin provided [string]
    --command       command to record [string]
    --from          lower range of timeline to render in ms [number]
    --height        height in lines [number]
    --help          print this help [boolean]
    --in            json file to use as input [string]
    --no-cursor     disable cursor rendering [boolean]
    --no-optimize   disable svgo optimization [boolean]
    --out           output file, emits to stdout if omitted, [string]
    --padding       distance between text and image bounds, [number]
    --padding-x     distance between text and image bounds on x axis [number]
    --padding-y     distance between text and image bounds on y axis [number]
    --profile       terminal profile file to use, requires --term [string]
    --term          terminal profile format [iterm2, xrdb, xresources, terminator, konsole, terminal, remmina, termite, tilda, xcfe], requires --profile [string]
    --to            upper range of timeline to render in ms [number]
    --width         width in columns [number]
    --window        render with window decorations [boolean]

  Examples
    $ cat rec.json | svg-term
    $ svg-term --cast 113643
    $ svg-term --cast 113643 --out examples/parrot.svg
`,
  {
    boolean: ['cursor', 'help', 'optimize', 'version', 'window'],
    string: [
      'at',
      'cast',
      'command',
      'from',
      'height',
      'in',
      'out',
      'padding',
      'padding-x',
      'padding-y',
      'profile',
      'term',
      'to',
      'width',
    ],
    default: {
      cursor: true,
      optimize: true,
      window: false,
    },
  }
);

async function main(cli: SvgTermCli) {
  const error = cliError(cli);

  if (cli.flags.hasOwnProperty('command') && !(await command('asciinema'))) {
    throw error(
      [
        `svg-term: asciinema must be installed when --command is specified.`,
        ` See instructions at: https://asciinema.org/docs/installation`,
      ].join('\n')
    );
  }

  const input = await getInput(cli);

  if (!input) {
    throw error(
      `svg-term: either stdin, --cast, --command or --in are required`
    );
  }

  const malformed = ensure(['height', 'width'], cli.flags, (name, val) => {
    if (!cli.flags.hasOwnProperty(name)) {
      return null;
    }

    const candidate = parseInt(val, 10);
    if (isNaN(candidate)) {
      return new TypeError(`${name} expected to be number, received "${val}"`);
    }

    return null;
  });

  if (malformed.length > 0) {
    throw error(`svg-term: ${malformed.map((m) => m.message).join('\n')}`);
  }

  const missingValue = ensure(
    ['cast', 'out', 'profile'],
    cli.flags,
    (name, val) => {
      if (!cli.flags.hasOwnProperty(name)) {
        return null;
      }
      if (name === 'cast' && typeof val === 'number') {
        return null;
      }
      if (typeof val === 'string') {
        return null;
      }

      return new TypeError(`${name} expected to be string, received "${val}"`);
    }
  );

  if (missingValue.length > 0) {
    throw error(`svg-term: ${missingValue.map((m) => m.message).join('\n')}`);
  }

  const shadowed = ensure(['at', 'from', 'to'], cli.flags, (name, val) => {
    if (!cli.flags.hasOwnProperty(name)) {
      return null;
    }

    const v = typeof val === 'number' ? val : parseInt(val, 10);

    if (isNaN(v)) {
      return new TypeError(`${name} expected to be number, received "${val}"`);
    }

    if (name !== 'at' && !isNaN(parseInt(cli.flags.at, 10))) {
      return new TypeError(`--at flag disallows --${name}`);
    }

    return null;
  });

  if (shadowed.length > 0) {
    throw error(`svg-term: ${shadowed.map((m) => m.message).join('\n')}`);
  }

  const term = cli.flags.hasOwnProperty('term')
    ? cli.flags.term
    : guessTerminal();
  const profile = cli.flags.hasOwnProperty('profile')
    ? cli.flags.profile
    : guessProfile(term);

  const guess: Guesses = {
    term,
    profile,
  };

  if (cli.flags.hasOwnProperty('term') || cli.flags.hasOwnProperty('profile')) {
    const unsatisfied = ['term', 'profile'].filter((n) => !guess[n]);

    if (unsatisfied.length > 0 && term !== 'hyper') {
      throw error(
        `svg-term: --term and --profile must be used together, ${unsatisfied.join(
          ', '
        )} missing`
      );
    }
  }

  const unknown = ensure(['term'], cli.flags, (name, val) => {
    if (!cli.flags.hasOwnProperty(name)) {
      return null;
    }

    if (parsers.TermSchemes.hasOwnProperty(cli.flags.term)) {
      return null;
    }

    return new TypeError(
      `${name} expected to be one of ${Object.keys(parsers.TermSchemes).join(
        ', '
      )}, received "${val}"`
    );
  });

  if (unknown.length > 0) {
    throw error(`svg-term: ${unknown.map((m) => m.message).join('\n')}`);
  }

  const [err, theme] = await getTheme(guess);

  if (err) {
    throw error(`svg-term: ${err.message}`);
  }

  const svg = render(input, {
    at: toNumber(cli.flags.at),
    cursor: toBoolean(cli.flags.cursor, true),
    from: toNumber(cli.flags.from),
    paddingX: toNumber(cli.flags.paddingX || cli.flags.padding) ?? 0,
    paddingY: toNumber(cli.flags.paddingY || cli.flags.padding) ?? 0,
    to: toNumber(cli.flags.to),
    height: toNumber(cli.flags.height),
    theme: theme as any,
    width: toNumber(cli.flags.width),
    window: toBoolean(cli.flags.window, false),
  });

  const optimized = toBoolean(cli.flags.optimize, true)
    ? optimize(svg, {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                collapseGroups: false,
              },
            },
          },
        ],
      })
    : { data: svg };

  if (typeof cli.flags.out === 'string') {
    await fs.writeFile(cli.flags.out, optimized.data);
  } else {
    process.stdout.write(optimized.data);
  }
}

async function command(name: string): Promise<boolean> {
  try {
    return (await commandExists(name)) === name;
  } catch {
    return false;
  }
}

function ensure(
  names: string[],
  flags: SvgTermCli['flags'],
  predicate: (name: string, val: any) => Error | null
): Error[] {
  return names
    .map((name) => predicate(name, flags[name]))
    .filter((e) => e instanceof Error)
    .map((e) => e as Error);
}

function cliError(cli: SvgTermCli): (message: string) => SvgTermError {
  return (message) => {
    const err: any = new Error(message);
    err.help = () => cli.help;

    return err;
  };
}

function getConfig(term: GuessedTerminal): any {
  switch (term) {
    case GuessedTerminal.terminal: {
      return macosAppConfig.sync(term)[0];
    }
    case GuessedTerminal.iterm2: {
      return macosAppConfig.sync(term)[0];
    }
    default:
      return null;
  }
}

function getPresets(term: GuessedTerminal): any {
  const config = getConfig(term);

  switch (term) {
    case GuessedTerminal.terminal: {
      return config['Window Settings'];
    }
    case GuessedTerminal.iterm2: {
      return config['Custom Color Presets'];
    }
    default:
      return null;
  }
}

function guessProfile(term: GuessedTerminal): string | null {
  if (os.platform() !== 'darwin') {
    return null;
  }

  const config = getConfig(term);

  if (!config) {
    return null;
  }

  switch (term) {
    case GuessedTerminal.terminal: {
      return config['Default Window Settings'];
    }
    case GuessedTerminal.iterm2: {
      return null;
    }
    default:
      return null;
  }
}

async function getInput(cli: SvgTermCli) {
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

function getParser(term: string) {
  switch (term) {
    case parsers.TermSchemes.iterm2:
      return parsers.iterm2;
    case parsers.TermSchemes.konsole:
      return parsers.konsole;
    case parsers.TermSchemes.remmina:
      return parsers.remmina;
    case parsers.TermSchemes.terminal:
      return parsers.terminal;
    case parsers.TermSchemes.terminator:
      return parsers.terminator;
    case parsers.TermSchemes.termite:
      return parsers.termite;
    case parsers.TermSchemes.tilda:
      return parsers.tilda;
    case parsers.TermSchemes.xcfe:
      return parsers.xfce;
    case parsers.TermSchemes.xresources:
      return parsers.xresources;
    case parsers.TermSchemes.xterm:
      return parsers.xterm;
    default:
      throw new Error(`unknown term parser: ${term}`);
  }
}

type Result<T> = [Error, null] | [null, T];

async function getTheme(
  guess: Guesses
): Promise<Result<parsers.TermScheme | null>> {
  if (guess.term === null && guess.profile === null) {
    return [null, null];
  }

  const p = guess.profile || '';
  const isFileProfile = ['~', '/', '.'].indexOf(p.charAt(0)) > -1;

  return isFileProfile
    ? parseTheme(guess.term as string, guess.profile as string)
    : extractTheme(guess.term as string, guess.profile as string);
}

async function parseTheme(
  term: string,
  input: string
): Promise<Result<parsers.TermScheme>> {
  try {
    const parser = getParser(term);
    const content = await fs.readFile(input, 'utf-8');

    return [null, parser(content)];
  } catch (err) {
    return [err as Error, null];
  }
}

async function extractTheme(
  term: string,
  name: string
): Promise<Result<parsers.TermScheme | null>> {
  if (!GuessedTerminal.hasOwnProperty(term)) {
    return [null, null];
  }

  if (os.platform() !== 'darwin') {
    return [null, null];
  }

  if (term === GuessedTerminal.hyper) {
    try {
      const filename = path.resolve(os.homedir(), '.hyper.js');
      const content = await fs.readFile(filename, 'utf-8');
      const result = parsers.hyper(content, { filename });

      return [null, result];
    } catch (err) {
      return [err as Error, null];
    }
  }

  const presets = getPresets(term as GuessedTerminal);

  if (!presets) {
    return [null, null];
  }

  if (!presets.hasOwnProperty(name)) {
    const err = new Error(
      `profile "${name}" not found for terminal "${term}". Available: ${Object.keys(
        presets
      ).join(', ')}`
    );

    return [err, null];
  }

  const theme = presets[name];
  const parser = getParser(term);

  if (!theme) {
    return [null, null];
  }

  switch (term) {
    case GuessedTerminal.iterm2:
    case GuessedTerminal.terminal:
      try {
        return [null, parser(plist.build(theme))];
      } catch (err) {
        return [err as Error, null];
      }
    default:
      return [null, null];
  }
}

async function record(
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

function toNumber(input: string | null): number | undefined {
  if (!input) {
    return undefined;
  }
  const candidate = parseInt(input, 10);
  if (isNaN(candidate)) {
    return undefined;
  }

  return candidate;
}

function toBoolean(input: any, fb: boolean): boolean {
  if (input === undefined) {
    return fb;
  }
  if (input === 'false') {
    return false;
  }
  if (input === 'true') {
    return true;
  }

  return input === true;
}

function withCli(
  fn: (cli: SvgTermCli) => Promise<void>,
  help: string = '',
  _options: any = {}
): void {
  const program = new Command();
  
  program
    .name('svg-term')
    .description('Share terminal sessions as razor-sharp animated SVG everywhere')
    .version('2.1.1')
    .option('--at <number>', 'timestamp of frame to render in ms')
    .option('--cast <string>', 'asciinema cast id to download, required if no stdin provided')
    .option('--command <string>', 'command to record')
    .option('--from <number>', 'lower range of timeline to render in ms')
    .option('--height <number>', 'height in lines')
    .option('--in <string>', 'json file to use as input')
    .option('--no-cursor', 'disable cursor rendering')
    .option('--no-optimize', 'disable svgo optimization')
    .option('--out <string>', 'output file, emits to stdout if omitted')
    .option('--padding <number>', 'distance between text and image bounds')
    .option('--padding-x <number>', 'distance between text and image bounds on x axis')
    .option('--padding-y <number>', 'distance between text and image bounds on y axis')
    .option('--profile <string>', 'terminal profile file to use, requires --term')
    .option('--term <string>', 'terminal profile format [iterm2, xrdb, xresources, terminator, konsole, terminal, remmina, termite, tilda, xcfe], requires --profile')
    .option('--to <number>', 'upper range of timeline to render in ms')
    .option('--width <number>', 'width in columns')
    .option('--window', 'render with window decorations');

  program.parse();
  
  const opts = program.opts();
  const args = program.args;

  // Convert commander result to match meow interface
  const cli: SvgTermCli = {
    flags: opts,
    help: help,
    input: args
  };

  fn(cli).catch((err) => {
    const msg = chalk.red(err.message);

    if (typeof err.help === 'function') {
      console.error('\n', msg);
      console.error(err.help());
      console.error('\n', msg);
      process.exit(1);
    }

    setTimeout(() => {
      throw err;
    }, 0);
  });
}
