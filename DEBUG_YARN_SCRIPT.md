# Debug: yarn script Command Issues

## Problems Found

### 1. Wrong Directory
You're trying to run `yarn script config` from the `arbitrage` directory, but this command only exists in the `predictfun` directory.

**Solution:** Navigate to the `predictfun` directory first:
```bash
cd predictfun
yarn script config -e devnet -k /Users/8bit/Downloads/X402Terminal2/wallet-keypair.json -r "https://devnet.helius-rpc.com/?api-key=c55c146c-71ef-41b9-a574-cb08f359c00c"
```

### 2. Missing npm Package
The `arbitrage/package.json` references `@types/tweetnacl` which doesn't exist in npm. This package has been removed from the dependencies.

**Fixed:** Removed `@types/tweetnacl` from `arbitrage/package.json` since `tweetnacl` doesn't have official TypeScript types.

## Correct Usage

### For predictfun (Solana Prediction Market):
```bash
cd predictfun
yarn script config -e devnet -k <keypair-path> -r "<rpc-url>"
```

### For arbitrage (Arbitrage Client):
The `arbitrage` project doesn't have a `script` command. It only has:
- `yarn build` - Build TypeScript
- `yarn dev` - Watch mode
- `yarn clean` - Clean dist folder

## Quick Fix Commands

1. **Install arbitrage dependencies (without the non-existent type package):**
   ```bash
   cd arbitrage
   npm install
   # or
   yarn install
   ```

2. **Run predictfun config:**
   ```bash
   cd ../predictfun
   yarn script config -e devnet -k /Users/8bit/Downloads/X402Terminal2/wallet-keypair.json -r "https://devnet.helius-rpc.com/?api-key=c55c146c-71ef-41b9-a574-cb08f359c00c"
   ```

## Summary

- ✅ Fixed `arbitrage/package.json` - removed non-existent `@types/tweetnacl`
- ✅ You need to be in `predictfun` directory to run `yarn script`
- ✅ Remember to quote URLs with query parameters

