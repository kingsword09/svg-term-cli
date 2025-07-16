declare module 'svg-term' {
  export interface RenderOptions {
    at?: number;
    cursor?: boolean;
    from?: number;
    height?: number;
    paddingX?: number;
    paddingY?: number;
    profile?: string;
    term?: string;
    to?: number;
    width?: number;
    window?: boolean;
    theme?: any;
  }

  export function render(
    cast: any,
    options?: RenderOptions
  ): string;
}


