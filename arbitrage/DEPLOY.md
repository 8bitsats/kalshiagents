# Deployment Guide

## Prerequisites

1. Node.js 18+ and npm installed
2. TypeScript 5.7+
3. All dependencies installed

## Build Steps

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Verify build output
ls -la dist/
```

## Publishing to npm (if applicable)

```bash
# Login to npm
npm login

# Publish
npm publish --access public
```

## Local Development

```bash
# Watch mode
npm run dev

# Clean build
npm run clean && npm run build
```

## TypeScript Configuration

The `tsconfig.json` is configured for:
- ESNext modules (matching package.json `"type": "module"`)
- Modern ES2022 target
- Bundler module resolution for better compatibility
- Strict type checking

## Common Issues

### Missing @types/node
If you see "Cannot find type definition file for 'node'", run:
```bash
npm install --save-dev @types/node
```

### Module Resolution Issues
The tsconfig uses `"moduleResolution": "bundler"` which works well with modern bundlers and Node.js ESM. If you encounter issues, try:
- `"moduleResolution": "node16"` for Node.js 16+ ESM
- `"moduleResolution": "nodenext"` for latest Node.js ESM support

### Ethers v6 Compatibility
The code uses `ethers.keccak256()` which is available in ethers v6. If you see import errors, ensure you're using ethers v6.13.4 or later.

