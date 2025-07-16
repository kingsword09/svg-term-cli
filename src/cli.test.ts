import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { DOMParser } from '@xmldom/xmldom';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

const parser = new DOMParser();

interface TestResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

const bin = async (
  args: string[] = [],
  options: any = {}
): Promise<TestResult> => {
  return new Promise((resolve) => {
    const child = spawn(
      'npx',
      ['tsx', path.join(__dirname, 'cli.ts'), ...args],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      resolve({
        exitCode,
        stdout,
        stderr,
      });
    });

    if (options.input !== undefined) {
      child.stdin.write(options.input);
    }
    child.stdin.end();
  });
};

test('prints help with non-zero exit code', async () => {
  const result = await bin([], { input: '' });
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr).toContain(
    'svg-term: either stdin, --cast, --command or --in are required'
  );
}, 10000);

test('prints help with zero exit code for --help', async () => {
  const result = await bin(['--help'], { input: '' });
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('print this help');
});

test('prints version with zero exit code for --version', async () => {
  const result = await bin(['--version'], { input: '' });
  expect(result.exitCode).toBe(0);
  expect(result.stdout.trim()).toBe(pkg.version);
});

test('works for minimal stdin input', async () => {
  const result = await bin([], {
    input: '[{"version": 2, "width": 1, "height": 1}, [1, "o", "foo"]]',
  });
  expect(result.exitCode).toBe(0);
});

test('is silent on stderr for minimal stdin input', async () => {
  const result = await bin([], {
    input: '[{"version": 2, "width": 1, "height": 1}, [1, "o", "foo"]]',
  });
  expect(result.stderr).toBe('');
  expect(result.exitCode).toBe(0);
});

test('emits svg for minimal stdin input', async () => {
  const result = await bin([], {
    input: '[{"version": 2, "width": 1, "height": 1}, [1, "o", "foo"]]',
  });

  const doc = parser.parseFromString(result.stdout, 'image/svg+xml');
  expect(doc.documentElement?.tagName).toBe('svg');
});

test('fails for faulty stdin input', async () => {
  const result = await bin([], {
    input: '{}',
  });
  expect(result.exitCode).toBe(1);
});

test('emits error on stderr for faulty stdin input', async () => {
  const result = await bin([], {
    input: '{}',
  });
  expect(result.stderr).toContain(
    'only asciicast v1 and v2 formats can be opened'
  );
});

test('is silent on stdout for faulty stdin input', async () => {
  const result = await bin([], {
    input: '{}',
  });
  expect(result.stdout).toBe('');
});
