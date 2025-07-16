import { render } from 'svg-term';
import { optimize } from 'svgo';
import fs from 'node:fs/promises';
import { getInput } from '../core/input';
import { getTheme } from '../core/theme';
import { validateFlags, cliError } from '../utils/validation';
import { toNumber, toBoolean } from '../utils/conversion';
import type { SvgTermCli } from '../types';

export class ConvertCommand {
  static async execute(cli: SvgTermCli): Promise<void> {
    // Validate flags
    const validationError = await validateFlags(cli);
    if (validationError) {
      throw validationError;
    }

    // Get input data
    const input = await getInput(cli);
    if (!input) {
      const error = cliError(cli);
      throw error('svg-term: either stdin, --cast, --command or --in are required');
    }

    // Get theme
    const [err, theme] = await getTheme(cli);
    if (err) {
      const error = cliError(cli);
      throw error(`svg-term: ${err.message}`);
    }

    // Render SVG
    let svg: string;
    try {
      svg = render(input, {
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
    } catch (renderError) {
      const error = cliError(cli);
      // Check if it's a format error
      if (renderError instanceof Error && renderError.message.includes('format')) {
        throw error('svg-term: only asciicast v1 and v2 formats can be opened');
      }
      throw error(`svg-term: ${renderError instanceof Error ? renderError.message : String(renderError)}`);
    }

    // Optimize SVG
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

    // Output result
    if (typeof cli.flags.out === 'string') {
      await fs.writeFile(cli.flags.out, optimized.data);
    } else {
      process.stdout.write(optimized.data);
    }
  }
}