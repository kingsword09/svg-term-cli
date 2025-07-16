export function toNumber(input: string | null): number | undefined {
  if (!input) {
    return undefined;
  }
  const candidate = parseInt(input, 10);
  if (isNaN(candidate)) {
    return undefined;
  }

  return candidate;
}

export function toBoolean(input: any, fb: boolean): boolean {
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