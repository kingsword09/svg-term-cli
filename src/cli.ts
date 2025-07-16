#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { ConvertCommand } from './commands';
import type { SvgTermCli } from './types';

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
  await ConvertCommand.execute(cli);
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
