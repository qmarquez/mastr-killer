type ConfigShorthandNode<T> = T & { pathToNode: string };

export type SourcePaths<T> = {
  [K in keyof T]: T[K] extends object
    ? SourcePaths<T[K]> & ConfigShorthandNode<T[K]>
    : string;
};

export type SourceProxy<T> = ConfigShorthandNode<T>;

/**
 * @param source Source object to be proxied and where you want to get the paths
 * @param basePath Base path to be used as the root path for the paths
 * @returns A object with the same structure as the source object, but with the paths to each leaf node
 * @example
 * const foo = { bar: { baz: 'qux', ber: 3 } }
 * // allow you to get the path to 'qux' by calling foo.bar.baz
 * const paths = buildMaStrKiller(foo)
 * foo.bar.baz === "bar.baz" // true
 * @example
 * const paths = buildMaStrKiller(foo, 'goo')
 * foo.bar.baz === "goo.bar.baz" // true
 * @example
 * // this allow you to destructure the paths object
 * const paths = buildMaStrKiller(foo, 'goo')
 * const { bar: { baz, ber } } = paths
 * baz === "goo.bar.baz" // true
 * ber === "goo.bar.ber" // true
 * @example
 * // you can get partial paths instead of going to a real leaf in case you need it
 * const paths = buildMaStrKiller(foo, 'goo')
 * const { bar } = paths
 * bar.pathToNode === "goo.bar" // true
 */
export default function maStrKiller<T>(
  source: T,
  basePath = '',
): SourcePaths<T> {
  const clonedSource = JSON.parse(JSON.stringify(source));
  const proxyHandler: ProxyHandler<SourceProxy<T>> = {
    get(parent, _accesedProp) {
      let accesedProp = _accesedProp;
      if (accesedProp in parent) {
        let result: typeof Proxy | string | null = null;
        accesedProp = String(accesedProp);
        const child = parent[accesedProp],
          rootPath = parent.pathToNode ?? `${basePath}`,
          isLeaf = typeof child !== 'object';

        if (!isLeaf) {
          if (!child.pathToNode) {
            child.pathToNode = '';
            if (rootPath) {
              child.pathToNode += `${rootPath}.`;
            }
            child.pathToNode += `${accesedProp}`;
          }

          result = new Proxy(child, proxyHandler);
        } else
          result = `${parent.pathToNode ?? rootPath}.${accesedProp}`.replace(
            '.pathToNode',
            '',
          );

        return result;
      }
      throw new Error('Missing config');
    },
  };

  return new Proxy(clonedSource, proxyHandler);
}
