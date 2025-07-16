import { command } from '../core/terminal';
import type { SvgTermCli, SvgTermError } from '../types';

export { cliError };

export async function validateFlags(cli: SvgTermCli): Promise<SvgTermError | null> {
  const error = cliError(cli);

  // Check asciinema installation if command is specified
  if (cli.flags.hasOwnProperty('command') && !(await command('asciinema'))) {
    return error(
      [
        `svg-term: asciinema must be installed when --command is specified.`,
        ` See instructions at: https://asciinema.org/docs/installation`,
      ].join('\n')
    );
  }

  // Validate numeric fields
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
    return error(`svg-term: ${malformed.map((m) => m.message).join('\n')}`);
  }

  // Validate string fields
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
    return error(`svg-term: ${missingValue.map((m) => m.message).join('\n')}`);
  }

  // Validate timeline flags
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
    return error(`svg-term: ${shadowed.map((m) => m.message).join('\n')}`);
  }

  return null;
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