import maStrKiller, {
  maStrKillerDeep,
  type PojoPaths,
  type DeepPaths,
} from '.';

const source = {
  dynamo: {
    table: 'users',
    endpoint: 'http://localhost:8000',
    nested: { deep: { value: 1 } },
  },
  port: 3000,
  tags: ['a', 'b', { bor: 'bor', bur: { burr: 3 } }],
  ids: new Set([1, 2]),
  meta: new Map([['k', 'v']]),
};

describe('maStrKiller (POJO)', () => {
  describe('without base path', () => {
    let paths: PojoPaths<typeof source>;
    beforeEach(() => {
      paths = maStrKiller(source);
    });

    it('resolves a leaf to its dot-path', () => {
      expect(paths.dynamo.table).toBe('dynamo.table');
    });

    it('resolves a deeply nested leaf', () => {
      expect(paths.dynamo.nested.deep.value).toBe('dynamo.nested.deep.value');
    });

    it('exposes the path of an intermediate node via pathToNode', () => {
      expect(paths.dynamo.nested.pathToNode).toBe('dynamo.nested');
    });

    it('supports destructuring intermediate nodes', () => {
      const { table, endpoint } = paths.dynamo;
      expect(table).toBe('dynamo.table');
      expect(endpoint).toBe('dynamo.endpoint');
    });

    it('treats arrays as leaves', () => {
      expect(paths.tags).toBe('tags');
    });

    it('treats Sets as leaves', () => {
      expect(paths.ids).toBe('ids');
    });

    it('treats Maps as leaves', () => {
      expect(paths.meta).toBe('meta');
    });

    it('throws on a missing property', () => {
      expect(
        () => (paths.dynamo as unknown as { nope: string }).nope,
      ).toThrow(/missing property "nope"/);
    });
  });

  describe('with base path', () => {
    let paths: PojoPaths<typeof source>;
    beforeEach(() => {
      paths = maStrKiller(source, 'config');
    });

    it('prefixes every path with the base path', () => {
      expect(paths.dynamo.table).toBe('config.dynamo.table');
    });

    it('prefixes intermediate node paths', () => {
      expect(paths.dynamo.pathToNode).toBe('config.dynamo');
    });
  });
});

describe('maStrKillerDeep (special structures)', () => {
  describe('without base path', () => {
    let paths: DeepPaths<typeof source>;
    beforeEach(() => {
      paths = maStrKillerDeep(source);
    });

    it('still resolves plain-object leaves', () => {
      expect(paths.dynamo.table).toBe('dynamo.table');
    });

    it('resolves an array position', () => {
      expect(paths.tags[0]).toBe('tags.0');
    });

    it('resolves a leaf inside an object nested in an array', () => {
      expect((paths.tags[2] as unknown as { bor: string }).bor).toBe(
        'tags.2.bor',
      );
    });

    it('exposes the path of the array itself via pathToNode', () => {
      expect((paths.tags as unknown as { pathToNode: string }).pathToNode).toBe(
        'tags',
      );
    });

    it('keeps Sets as leaves', () => {
      expect(paths.ids).toBe('ids');
    });
  });

  describe('with base path', () => {
    it('prefixes array positions with the base path', () => {
      const paths = maStrKillerDeep(source, 'goo');
      expect(paths.tags[0]).toBe('goo.tags.0');
    });
  });
});
