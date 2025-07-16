import { GuessedTerminal, guessTerminal } from 'guess-terminal';
import * as macosAppConfig from 'macos-app-config';
import * as parsers from 'term-schemes';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import plist from 'plist';
import type { SvgTermCli, Guesses } from '../types';

type Result<T> = [Error, null] | [null, T];

export async function getTheme(cli: SvgTermCli): Promise<Result<parsers.TermScheme | null>> {
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
      throw new Error(
        `svg-term: --term and --profile must be used together, ${unsatisfied.join(
          ', '
        )} missing`
      );
    }
  }

  // Validate term
  if (cli.flags.hasOwnProperty('term') && !parsers.TermSchemes.hasOwnProperty(cli.flags.term)) {
    throw new Error(
      `term expected to be one of ${Object.keys(parsers.TermSchemes).join(
        ', '
      )}, received "${cli.flags.term}"`
    );
  }

  if (guess.term === null && guess.profile === null) {
    return [null, null];
  }

  const p = guess.profile || '';
  const isFileProfile = ['~', '/', '.'].indexOf(p.charAt(0)) > -1;

  return isFileProfile
    ? parseTheme(guess.term as string, guess.profile as string)
    : extractTheme(guess.term as string, guess.profile as string);
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