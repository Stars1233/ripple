# @tsrx/typescript-plugin

[![npm version](https://img.shields.io/npm/v/%40tsrx%2Ftypescript-plugin?logo=npm)](https://www.npmjs.com/package/@tsrx/typescript-plugin)
[![npm downloads](https://img.shields.io/npm/dm/%40tsrx%2Ftypescript-plugin?logo=npm&label=downloads)](https://www.npmjs.com/package/@tsrx/typescript-plugin)

TypeScript plugin for Ripple that provides language support for `.tsrx` files.

## Usage

### VS Code

**If you're using VS Code with the Ripple extension, you don't need to configure
this plugin!** The Ripple language server handles everything automatically.

### Other Editors or Standalone Usage

For editors that don't use the Ripple language server (like WebStorm, Sublime
Text, or command-line `tsc`), add this plugin to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "ripple",
    "plugins": [
      {
        "name": "@tsrx/typescript-plugin"
      }
    ]
  }
}
```

## Compiler selection

All TSRX targets use the `.tsrx` extension. Normally, the compiler is detected
automatically from the installed target packages and the nearest `package.json`.
To remove ambiguity when multiple target compilers are installed, or to use a
third-party compiler, select one explicitly with the top-level `tsrx.compiler`
option:

```json
{
  "tsrx": {
    "compiler": "@tsrx/ripple"
  },
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "ripple",
    "plugins": [
      {
        "name": "@tsrx/typescript-plugin"
      }
    ]
  }
}
```

`compiler` must be a bare package specifier, such as `@tsrx/ripple`,
`@tsrx/react`, `@tsrx/solid`, `@tsrx/preact`, `@tsrx/vue`, `octane`, or a
third-party TSRX compiler package. Package subpaths are supported; relative and
absolute paths are not.

Compiler declarations follow the active TypeScript project's explicit `tsconfig`
inheritance graph:

- `extends` chains, arrays, JSONC files, and package-based configs are supported.
- Base configs are applied first. Child configs and later `extends` entries take
  precedence.
- The compiler package is resolved relative to the config that supplied the
  effective declaration.
- Nested projects do not inherit from unrelated ancestor configs.
- An invalid or unresolved effective declaration prevents automatic fallback. A
  valid declaration in a child config still overrides a failed lower-priority
  base.

The language server, tsserver plugin, and `tsrx-tsc` use the TypeScript project's
selected config. When that project context is unavailable, resolution starts at
the nearest `tsconfig.json`. If no `tsrx.compiler` value is declared, the plugin
falls back to installed target detection, using the nearest `package.json` to
disambiguate when multiple supported compiler packages are present.

## What it does

This plugin:

- Registers `.tsrx` files as recognized TypeScript languages
- Transforms Ripple syntax to TypeScript for type checking
- Integrates with Volar for virtual code generation and source mapping

## Architecture Note

This plugin uses Volar's TypeScript plugin system. When configured in
`tsconfig.json`, TypeScript's tsserver will load this plugin and create a language
service instance.

The Ripple VS Code extension uses a language server instead, which provides the
same functionality plus additional features like diagnostics and formatting. Both
can coexist (they create separate instances), but you only need one.
