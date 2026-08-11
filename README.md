# mastr-killer

**Magic String Killer** — kills magic strings tied to object property access (config
paths, i18n keys, or any string used to reach a property) while keeping autocomplete,
go-to-reference and type checking wired to the source object.

It returns a proxy that mirrors the shape of your object, but reading a leaf gives you
its **dot-path string** instead of the value:

```ts
import { maStrKiller } from 'mastr-killer';

const paths = maStrKiller({ dynamo: { table: 'users', endpoint: '...' } }, 'config');

paths.dynamo.table; // 'config.dynamo.table'   ← typed, refactor-safe
paths.dynamo.pathToNode; // 'config.dynamo'    ← path of an intermediate node

// destructuring works
const { table, endpoint } = paths.dynamo;
table; // 'config.dynamo.table'
endpoint; // 'config.dynamo.endpoint'
```

Typical use with NestJS `ConfigService`, replacing the literal `'config.dynamo.table'`:

```ts
this.configService.get(paths.dynamo.table);
```

## Two flavors

The only difference is how arrays are handled.

| Function | Arrays | Sets / Maps | Use case |
| --- | --- | --- | --- |
| `maStrKiller` (default) | **leaf** — `paths.tags → 'tags'` | leaf | Plain config objects (POJOs) |
| `maStrKillerDeep` | **navigable** — `paths.tags[0] → 'tags.0'` | leaf | You need paths into array positions |

```ts
import maStrKiller, { maStrKillerDeep } from 'mastr-killer';

maStrKiller({ tags: ['a', 'b'] }).tags; // 'tags'

const deep = maStrKillerDeep({ hosts: ['a', { port: 80 }] });
deep.hosts[0]; // 'hosts.0'
(deep.hosts[1] as { port: string }).port; // 'hosts.1.port'
```

## API

```ts
maStrKiller<T>(source: T, basePath?: string): PojoPaths<T>
maStrKillerDeep<T>(source: T, basePath?: string): DeepPaths<T>
```

- `source` — the object whose property paths you want to reference.
- `basePath` — optional prefix prepended to every path (e.g. a config namespace).
- Reading a **leaf** returns its dot-path `string`.
- Reading `pathToNode` on any intermediate node returns that node's dot-path.
- Reading a property that does not exist **throws** — so typos surface immediately
  instead of leaking an undefined magic string.

## Notes

- The source object is **not mutated** and never deep-cloned, so non-serializable
  values (functions, `Date`, class instances) are handled fine — they are simply
  treated as leaves.
- Operates on regular (non-frozen) objects.

## Test

```bash
npm install
npm test
```
