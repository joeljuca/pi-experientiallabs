# Contributing to @joeljuca/pi-experientiallabs

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/joeljuca/pi-experientiallabs/issues) to avoid duplicates
2. Open a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node.js version, pi version)

### Suggesting Features

1. Check [existing issues](https://github.com/joeljuca/pi-experientiallabs/issues) for similar suggestions
2. Open a new issue with the `enhancement` label
3. Describe the feature and its use case

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and type checks
5. Commit with a clear message
6. Push to your fork and submit a PR

## Development Setup

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- Git

### Getting Started

```bash
# Clone your fork
git clone https://github.com/your-username/pi-experientiallabs.git
cd pi-experientiallabs

# Install dependencies
npm install

# Build the project
npm run build

# Watch mode (for development)
npm run dev
```

### Project Structure

```
pi-experientiallabs/
├── src/
│   └── index.ts          # Extension source code
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # npm package configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # Documentation
├── CONTRIBUTING.md       # This file
├── LICENSE               # MIT license
└── .gitignore            # Git ignore rules
```

### Available Scripts

```bash
npm run build       # Build the project
npm run dev         # Watch mode for development
npm run typecheck   # Run TypeScript type checking
npm run prepublish  # Build before publishing (runs automatically)
```

## Coding Guidelines

### TypeScript

- Use TypeScript strict mode
- Add JSDoc comments for public APIs
- Export types that users might need
- Use meaningful variable and function names

### Code Style

- Follow the existing code style
- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Keep lines under 100 characters when possible

### Commits

- Use clear, descriptive commit messages
- Start with a verb in imperative mood (e.g., "Add", "Fix", "Update")
- Keep the subject line under 72 characters
- Reference issues when applicable (e.g., "Fix #123")

### Example Commit Messages

```
Add custom base URL configuration
Fix model parsing for edge cases
Update README with troubleshooting section
Refactor API response handling
```

## Testing

### Manual Testing

1. Build the project: `npm run build`
2. Link locally: `npm link`
3. Test with pi:
   ```bash
   # Test without installing
   pi -e npm:@joeljuca/pi-experientiallabs

   # Or install and test
   pi install npm:@joeljuca/pi-experientiallabs
   ```

### Type Checking

Always run type checking before submitting:

```bash
npm run typecheck
```

## Pull Request Process

1. **Update documentation** if your change affects users
2. **Add tests** if applicable
3. **Update CHANGELOG.md** with your changes
4. **Ensure CI passes** (if configured)
5. **Request review** from maintainers

### PR Description

Include in your PR description:

- What the change does
- Why the change is needed
- How to test it
- Any breaking changes

## Release Process

Releases are managed by maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag: `git tag v1.0.0`
4. Push: `git push origin main --tags`
5. Publish to npm: `npm publish`

## Questions?

Open an issue for any questions about contributing.
