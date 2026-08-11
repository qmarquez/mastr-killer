# mastr-killer

> **Magic String Killer** — turn object property paths into **typed, refactor-safe
> dot-path strings**, without losing autocomplete or go-to-reference.

```bash
npm install mastr-killer
```

## The problem

Some APIs don't take your value — they take a **string that points at it**. The classic
one is NestJS `ConfigService`:

```ts
// 🚫 magic string: no autocomplete, no type-check, silently breaks on rename
this.config.get('database.dynamo.table');
```

That `'database.dynamo.table'` is decoupled from your config object. Rename `dynamo` and
nothing complains until runtime. The same pain shows up with **i18n keys**, feature-flag
keys, form field paths — anywhere a string is used to reach a property.

## The solution

`maStrKiller` wraps your object and returns a **mirror of its shape** where reading a leaf
gives you its **dot-path string** instead of the value. The path is fully typed against the
source object, so autocomplete, refactors and "find references" just work.

```ts
import { maStrKiller } from 'mastr-killer';

const config = { database: { dynamo: { table: 'users', endpoint: '...' } } };
const paths = maStrKiller(config);

paths.database.dynamo.table;
// => 'database.dynamo.table'   ✅ typed, autocompleted, rename-safe
```

## Primary use case: NestJS `ConfigService`

Built mainly for the `@nestjs/config` pattern. Define your config with `registerAs`, build
the paths mirror once, and reference it everywhere instead of literals.

```ts
// config.ts
import { registerAs } from '@nestjs/config';
import { maStrKiller } from 'mastr-killer';

const appConfig = {
  dynamo: { table: 'users', endpoint: 'http://localhost:8000' },
  http: { timeoutMs: 3000 },
};

export const CONFIG_NAMESPACE = 'config';
export default registerAs(CONFIG_NAMESPACE, () => appConfig);

// `basePath` matches the registerAs namespace, so paths line up with ConfigService keys
export const configPaths = maStrKiller(appConfig, CONFIG_NAMESPACE);
```

```ts
// any.service.ts
import { configPaths } from './config';

@Injectable()
export class AnyService {
  constructor(private readonly config: ConfigService) {}

  get table() {
    // 🚫 before: this.config.get('config.dynamo.table')
    // ✅ after:
    return this.config.get(configPaths.dynamo.table);
  }
}

configPaths.dynamo.table; // 'config.dynamo.table'
configPaths.dynamo.pathToNode; // 'config.dynamo'  (path of an intermediate node)
```

## Not just Nest

It works with **any** strategy where a string addresses a property in an object. Same idea,
no framework:

```ts
// i18n keys
const t = maStrKiller(translations);
i18n.translate(t.home.header.title); // 'home.header.title'

// destructuring keeps the paths
const { title, subtitle } = maStrKiller(translations).home.header;
title; // 'home.header.title'
subtitle; // 'home.header.subtitle'
```

If your target consumes a dot-path string, `mastr-killer` can feed it.

## Two variants — the only difference is arrays

| Function | Arrays | Sets / Maps | When to use |
| --- | --- | --- | --- |
| **`maStrKiller`** (default) | **leaf** → `paths.tags` = `'tags'` | leaf | Plain config/objects (POJOs). The `ConfigService` case. |
| **`maStrKillerDeep`** | **navigable** → `paths.tags[0]` = `'tags.0'` | leaf | You need paths into array positions. |

```ts
import maStrKiller, { maStrKillerDeep } from 'mastr-killer';

maStrKiller({ tags: ['a', 'b'] }).tags; // 'tags'  (whole array is one config value)

const deep = maStrKillerDeep({ hosts: ['a', { port: 80 }] });
deep.hosts[0]; // 'hosts.0'
(deep.hosts[1] as { port: string }).port; // 'hosts.1.port'
```

## API

```ts
function maStrKiller<T>(source: T, basePath?: string): PojoPaths<T>;
function maStrKillerDeep<T>(source: T, basePath?: string): DeepPaths<T>;
```

| Param | Description |
| --- | --- |
| `source` | The object whose property paths you want to reference. |
| `basePath` | Optional prefix prepended to every path (e.g. the `registerAs` namespace). Default `''`. |

Behavior:

- Reading a **leaf** returns its dot-path `string`.
- Reading `pathToNode` on any **intermediate node** returns that node's dot-path.
- Reading a property that **doesn't exist throws** — typos surface immediately instead of
  leaking an `undefined` magic string.

Exported types: `PojoPaths<T>`, `DeepPaths<T>`, `PathNode`.

## Notes

- The source object is **never mutated and never deep-cloned**, so non-serializable values
  (functions, `Date`, class instances) are fine — they're treated as leaves.
- Operates on regular (non-frozen) objects.
- Ships as CommonJS with type declarations; works in Node and with NestJS out of the box.

## Development

```bash
npm install
npm test    # jest
npm run build   # emits dist/ (js + d.ts)
```

## License

See [LICENSE](./LICENSE).
