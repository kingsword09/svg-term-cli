# Contributing to svg-term-cli

Thank you for your interest in contributing to svg-term-cli! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- **Node.js 20.0.0 or higher** - Required for modern JavaScript features and built-in APIs
- **pnpm** - Recommended package manager for faster installs and better dependency management

### Getting Started

1. **Fork and clone the repository:**

   ```sh
   git clone https://github.com/kingsword09/svg-term-cli.git
   cd svg-term-cli
   ```

2. **Install dependencies:**

   ```sh
   pnpm install
   ```

3. **Build the project:**

   ```sh
   pnpm build
   ```

4. **Run tests to ensure everything works:**
   ```sh
   pnpm test
   ```

## Development Workflow

### Available Scripts

- `pnpm build` - Build the project (generates both ESM and CommonJS outputs)
- `pnpm dev` - Run the CLI in development mode with tsx
- `pnpm test` - Run all tests once
- `pnpm test:watch` - Run tests in watch mode during development
- `pnpm test:ui` - Run tests with Vitest UI for interactive debugging
- `pnpm test:coverage` - Generate test coverage report
- `pnpm lint` - Lint code with oxlint (fast Rust-based linter)
- `pnpm format` - Format code with Prettier

### Code Style and Standards

This project follows modern TypeScript and JavaScript best practices:

#### TypeScript Configuration

- **Strict mode enabled** - All strict TypeScript checks are enforced
- **ES2022 target** - Modern JavaScript features are used
- **ESM modules** - Primary module system with CommonJS compatibility
- **Type declarations** - All public APIs must have proper type definitions

#### Code Quality Tools

- **oxlint** - Fast Rust-based linter for code quality
- **Prettier** - Automatic code formatting
- **Vitest** - Modern test runner with TypeScript support
- **zshy** - Modern TypeScript build tool for dual module output

#### Coding Conventions

- Use **ES6+ features** (async/await, destructuring, arrow functions)
- Prefer **explicit types** over `any`
- Use **Node.js built-in APIs** when available (e.g., built-in `fetch`)
- Follow **functional programming** patterns where appropriate
- Write **comprehensive tests** for new features

### Making Changes

1. **Create a feature branch:**

   ```sh
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards above

3. **Add or update tests** for your changes:

   ```sh
   pnpm test:watch  # Run tests in watch mode while developing
   ```

4. **Lint and format your code:**

   ```sh
   pnpm lint
   pnpm format
   ```

5. **Build the project** to ensure it compiles:

   ```sh
   pnpm build
   ```

6. **Run the full test suite:**
   ```sh
   pnpm test
   ```

### Testing Guidelines

- **Unit tests** for individual functions and modules
- **Integration tests** for CLI functionality
- **Type tests** to ensure TypeScript definitions are correct
- **Coverage** should be maintained or improved
- Tests should be **fast and reliable**

### Commit Guidelines

- Use **clear, descriptive commit messages**
- Follow **conventional commits** format when possible:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `refactor:` for code refactoring
  - `test:` for test additions/changes
  - `chore:` for maintenance tasks

### Pull Request Process

1. **Ensure all checks pass:**
   - Tests pass (`pnpm test`)
   - Code is linted (`pnpm lint`)
   - Code is formatted (`pnpm format`)
   - Project builds successfully (`pnpm build`)

2. **Update documentation** if needed:
   - Update README.md for user-facing changes
   - Add JSDoc comments for new APIs
   - Update examples if applicable

3. **Create a pull request** with:
   - Clear title and description
   - Reference to any related issues
   - Screenshots or examples if applicable
   - List of changes made

4. **Respond to feedback** and make requested changes

## Project Architecture

### Module System

- **ESM-first** with CommonJS compatibility
- **Dual package exports** for maximum compatibility
- **Node.js built-in modules** preferred over external dependencies

### Build System

- **zshy** for modern TypeScript compilation
- **Automatic dual output** (ESM + CommonJS)
- **Type declaration generation** for both formats
- **Source maps** for debugging

### Dependencies

- **Minimal runtime dependencies** - Only essential packages
- **Modern alternatives** preferred (e.g., Vitest over Jest)
- **Regular updates** to maintain security and performance

## Getting Help

- **Issues** - Report bugs or request features via GitHub Issues
- **Discussions** - Ask questions or discuss ideas in GitHub Discussions
- **Code Review** - All contributions are reviewed by maintainers

## Recognition

Contributors are recognized in:

- Git commit history
- Release notes for significant contributions
- GitHub contributors list

Thank you for contributing to svg-term-cli! 🎉
