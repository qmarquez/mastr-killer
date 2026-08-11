export type PathNode = { readonly pathToNode: string };

type SpecialStructure =
  | readonly unknown[]
  | Set<unknown>
  | Map<unknown, unknown>
  | Date
  | ((...args: unknown[]) => unknown);

/**
 * Mirrors the shape of `T`, but every leaf is the dot-path string that reaches
 * it. Arrays, Sets and Maps are treated as leaves.
 */
export type PojoPaths<T> = {
  [K in keyof T]: T[K] extends SpecialStructure
    ? string
    : T[K] extends object
      ? PojoPaths<T[K]> & PathNode
      : string;
};

/**
 * Like {@link PojoPaths}, but arrays stay navigable so their positions (and any
 * nested objects) also resolve to dot-paths. Sets and Maps remain leaves.
 */
export type DeepPaths<T> = {
  [K in keyof T]: T[K] extends
    | Set<unknown>
    | Map<unknown, unknown>
    | Date
    | ((...args: unknown[]) => unknown)
    ? string
    : T[K] extends object
      ? DeepPaths<T[K]> & PathNode
      : string;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
};

const wrap = (
  target: object,
  path: string,
  isNavigable: (value: unknown) => boolean,
): unknown =>
  new Proxy(target, {
    get(node, prop) {
      if (prop === 'pathToNode') return path;
      if (typeof prop === 'symbol') return Reflect.get(node, prop);
      if (!(prop in node)) {
        throw new Error(
          `maStrKiller: missing property "${prop}" at "${path || '<root>'}"`,
        );
      }
      const childPath = path ? `${path}.${prop}` : prop;
      const child = (node as Record<string, unknown>)[prop];
      return isNavigable(child)
        ? wrap(child as object, childPath, isNavigable)
        : childPath;
    },
  });

/**
 * Builds a paths object mirroring `source` where reading a leaf returns its
 * dot-path string instead of its value, killing magic strings while keeping
 * autocomplete and go-to-reference tied to the source type.
 *
 * Only plain objects are navigable; arrays, Sets and Maps resolve to the path
 * of the structure itself. For array-position paths use {@link maStrKillerDeep}.
 *
 * @param source Object whose property paths you want to reference.
 * @param basePath Prefix prepended to every path (e.g. a NestJS config namespace).
 * @example
 * const paths = maStrKiller({ dynamo: { table: 'users' } }, 'config');
 * paths.dynamo.table; // 'config.dynamo.table'
 * paths.dynamo.pathToNode; // 'config.dynamo'
 * const { table } = paths.dynamo; // 'config.dynamo.table'
 */
export function maStrKiller<T extends object>(
  source: T,
  basePath = '',
): PojoPaths<T> {
  return wrap(source, basePath, isPlainObject) as PojoPaths<T>;
}

/**
 * Like {@link maStrKiller}, but arrays are navigable too, so positions and any
 * objects nested inside them resolve to dot-paths. Sets and Maps stay leaves.
 *
 * @example
 * const paths = maStrKillerDeep({ hosts: ['a', { port: 80 }] });
 * paths.hosts[0]; // 'hosts.0'
 * (paths.hosts[1] as { port: string }).port; // 'hosts.1.port'
 */
export function maStrKillerDeep<T extends object>(
  source: T,
  basePath = '',
): DeepPaths<T> {
  const isNavigable = (value: unknown): boolean =>
    isPlainObject(value) || Array.isArray(value);
  return wrap(source, basePath, isNavigable) as DeepPaths<T>;
}

export default maStrKiller;
