# Build Instructions

## Summary of Fixes

✅ **tsconfig.json** - Updated to modern ES2022 configuration with bundler module resolution
✅ **Ethers v6 compatibility** - Fixed keccak256 import to use `ethers.keccak256()` directly
✅ **Type definitions** - Configured proper type resolution

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- All dependencies from `package.json`

## Build Steps

### 1. Install Dependencies

```bash
cd /Users/8bit/Downloads/agents/arbitrage
npm install
```

If you encounter permission errors, you may need to:
- Run with appropriate permissions
- Or use `npm install --legacy-peer-deps` if there are peer dependency conflicts

### 2. Verify Dependencies

Ensure these packages are installed:
- `@types/node` (for TypeScript types)
- `ethers` v6.13.4+
- `@solana/web3.js`
- `@polymarket/clob-client`
- Other dependencies listed in `package.json`

### 3. Build the Project

```bash
npm run build
```

This will:
- Compile TypeScript files from `src/` to JavaScript in `dist/`
- Generate type definition files (`.d.ts`) in `dist/`
- Output should be in `dist/` directory

### 4. Verify Build Output

```bash
ls -la dist/
```

You should see:
- `index.js` - Main entry point
- `index.d.ts` - Type definitions
- `clients/` - Client implementations
- `lib/` - Library utilities

### 5. Test the Build (Optional)

You can test importing the built module:

```typescript
import { UnifiedArbitrageClient, SolanaToEVMBridge } from "./dist/index.js";
```

## Configuration Details

### tsconfig.json Changes

- **Target**: ES2022 (modern JavaScript features)
- **Module**: ESNext (matches package.json `"type": "module"`)
- **Module Resolution**: Bundler (works with modern bundlers and Node.js ESM)
- **Strict Mode**: Enabled for better type safety

### Package.json

- **Type**: `"module"` - Uses ESNext modules
- **Main**: `"./dist/index.js"` - Entry point
- **Types**: `"./dist/index.d.ts"` - Type definitions

## Troubleshooting

### Error: Cannot find type definition file for 'node'
**Solution**: Install `@types/node`
```bash
npm install --save-dev @types/node
```

### Error: Cannot find module 'ethers'
**Solution**: Install ethers
```bash
npm install ethers@^6.13.4
```

### Error: Module resolution issues
**Solution**: The tsconfig uses `"moduleResolution": "bundler"`. If you need Node.js-specific resolution, change to:
```json
"moduleResolution": "node16"
```

### Build succeeds but runtime errors
- Ensure you're using Node.js 18+ (for ESM support)
- Check that all dependencies are installed
- Verify the `dist/` directory contains the compiled files

## Deployment

Once built, the `dist/` directory contains everything needed to use the package:

1. **Local usage**: Import from `./dist/index.js`
2. **npm publish**: The package.json is configured for npm publishing
3. **Bundler integration**: Works with webpack, rollup, esbuild, etc.

## Next Steps

After successful build:
1. Test the compiled code
2. Update imports in consuming projects to use `dist/` output
3. Consider adding tests
4. Publish to npm if needed (see DEPLOY.md)

