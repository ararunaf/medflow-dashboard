# libxml2.wasm

The wasm binary powering `libxml2-wasm`'s real XSD validation
(`../tiss-xsd-validator.ts`), extracted from the base64 string embedded in
`node_modules/libxml2-wasm/lib/libxml2raw.mjs` (the package's own Emscripten
build output — same bytes, just pulled out of the JS string literal).

## Why this file exists

Cloudflare Workers can't run that embedded-base64 loading path: Emscripten's
glue feature-detects Node via `process.versions.node` (which Workers'
`nodejs_compat` flag polyfills, tricking it into a `createRequire` call that
throws in the bundled output), and even once that's disabled, its fallback
async wasm-loading chain doesn't settle inside Cloudflare's top-level `await`
deploy validation ("Top-level await in module is unsettled", error 10021).

`vite.config.ts`'s `patchLibxml2WasmForWorkers` plugin imports this file
through `@cloudflare/vite-plugin`'s native `CompiledWasm` module support
(precompiled `WebAssembly.Module` at build time) and wires it in as
Emscripten's `instantiateWasm` override, instantiated synchronously — so
there's no unresolved promise left when Workers validates the module.

## Re-extracting after a `libxml2-wasm` upgrade

If `npm update libxml2-wasm` changes the embedded binary, `vite.config.ts`'s
build will fail loudly (the plugin's needle checks catch a changed source
shape) rather than silently deploying a stale wasm. Re-extract with:

```js
const fs = require("fs");
const src = fs.readFileSync("node_modules/libxml2-wasm/lib/libxml2raw.mjs", "utf8");
const marker = 'ra??=Ba("';
const start = src.indexOf(marker) + marker.length;
const end = src.indexOf('")', start);
fs.writeFileSync(
  "src/lib/services/tiss/xml/vendor/libxml2.wasm",
  Buffer.from(src.slice(start, end), "base64"),
);
```

Then verify the first four bytes are the wasm magic number (`00 61 73 6d`)
before committing.
