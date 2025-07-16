> Share terminal sessions as razor-sharp animated SVG everywhere

<p align="center">
  <img width="600" src="https://cdn.rawgit.com/marionebl/svg-term-cli/1250f9c1/examples/parrot.svg">
</p>

> Example generated with `svg-term --cast 113643 --out examples/parrot.svg --window --no-cursor --from=4500`

# svg-term-cli

* 💄 Render asciicast to animated SVG
* 🌐 Share asciicasts everywhere (sans JS)
* 🤖 Style with common [color profiles](https://github.com/marionebl/term-schemes#supported-formats)

## Requirements

- **Node.js 20.0.0 or higher** - This project uses modern JavaScript features and Node.js built-in APIs
- **pnpm** (recommended) or npm for package management

## Install

1. Install asciinema via: https://asciinema.org/docs/installation
2. Install svg-term-cli:
   
   **Using pnpm (recommended):**
   ```sh
   pnpm add -g svg-term-cli
   ```

## Usage

Generate the `parrot.svg` example from asciicast at <https://asciinema.org/a/113643>

```
svg-term --cast=113643 --out examples/parrot.svg --window
```

## Interface

```
λ svg-term --help

  Share terminal sessions as razor-sharp animated SVG everywhere

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
```

## Rationale

Replace GIF asciicast recordings where you can not use the [asciinema player](https://asciinema.org/), e.g. `README.md` files on GitHub and the npm registry.

The image at the top of this README is an example. See how sharp the text looks, even when you zoom in? That’s because it’s an SVG!

## Related

* [asciinema/asciinema](https://github.com/asciinema/asciinema) - Terminal session recorder
* [derhuerst/asciicast-to-svg](https://github.com/derhuerst/asciicast-to-svg) - Render frames of Asciicasts as SVGs
* [marionebl/svg-term](https://github.com/marionebl/svg-term) - Render asciicast to animated SVG
* [marionebl/term-schemes](https://github.com/marionebl/term-schemes) - Parse and normalize common terminal emulator color schemes

## Development

### Prerequisites

- Node.js 20.0.0 or higher
- pnpm (recommended) or npm

### Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/marionebl/svg-term-cli.git
   cd svg-term-cli
   ```

2. Install dependencies:
   ```sh
   pnpm install
   ```

3. Build the project:
   ```sh
   pnpm build
   ```

### Available Scripts

- `pnpm build` - Build the project using zshy (generates both ESM and CommonJS outputs)
- `pnpm dev` - Run the CLI in development mode
- `pnpm test` - Run tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm lint` - Lint code with oxlint
- `pnpm format` - Format code with Prettier

### Project Structure

- `src/` - TypeScript source code
- `dist/` - Built output (ESM and CommonJS)
- `examples/` - Example SVG outputs
- `.kiro/` - Kiro IDE configuration and specs

### Contributing

1. **Fork the repository** and create your feature branch from `main`
2. **Install dependencies** with `pnpm install`
3. **Make your changes** following the existing code style
4. **Add tests** for new functionality
5. **Run the test suite** with `pnpm test`
6. **Lint your code** with `pnpm lint`
7. **Format your code** with `pnpm format`
8. **Build the project** with `pnpm build` to ensure it compiles
9. **Submit a pull request** with a clear description of your changes

### Code Style

This project uses:
- **TypeScript** with strict type checking
- **Prettier** for code formatting
- **oxlint** for fast linting
- **Vitest** for testing
- **ESM modules** with CommonJS compatibility

Please ensure your code follows these conventions and passes all checks before submitting.

## Gallery

* [marionebl/commitlint](https://github.com/marionebl/commitlint)
* [marionebl/share-cli](https://github.com/marionebl/share-cli)
* [marionebl/remote-share-cli](https://github.com/marionebl/remote-share-cli)

## License

Copyright 2017. Released under the MIT license.
