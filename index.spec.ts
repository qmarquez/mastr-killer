import maStrKiller, { type SourcePaths } from '.';

const testObject = {
  foo: {
    bar: 'bar',
    baz: 3,
    ber: {
      qux: 'qux',
      beg: 3,
    },
  },
  arr: [
    '1',
    2,
    {
      bor: 'bor',
      bur: {
        burr: 3,
      },
    },
  ],
};

describe('Magic String Killer', () => {
  describe('[Without base path]', () => {
    let pathsObj: SourcePaths<typeof testObject>;
    beforeEach(() => {
      pathsObj = maStrKiller(testObject);
    });
    it('should return the correct path to a leaf node', () => {
      expect(pathsObj.foo.bar).toBe('foo.bar');
    });
    it('should return the correct path to a leaf node with a nested object', () => {
      expect(pathsObj.foo.ber.qux).toBe('foo.ber.qux');
    });
    it('should return the correct path to a middle node', () => {
      expect(pathsObj.foo.ber.pathToNode).toBe('foo.ber');
    });
    it('should return the correct path to a middle node with an array position', () => {
      expect(pathsObj.arr[0]).toBe('arr.0');
    });
    it('should return the correct path to a middle node with an array position nested object', () => {
      expect((pathsObj.arr[2] as { bor: string }).bor).toBe('arr.2.bor');
    });
  });
  describe('[With base path]', () => {
    let pathsObj: SourcePaths<typeof testObject>;
    beforeEach(() => {
      pathsObj = maStrKiller(testObject, 'goo');
    });
    it('should return the correct path to a leaf node', () => {
      expect(pathsObj.foo.bar).toBe('goo.foo.bar');
    });
    it('should return the correct path to a leaf node with a nested object', () => {
      expect(pathsObj.foo.ber.qux).toBe('goo.foo.ber.qux');
    });
    it('should return the correct path to a middle node', () => {
      expect(pathsObj.foo.ber.pathToNode).toBe('goo.foo.ber');
    });
    it('should return the correct path to a middle node with an array position', () => {
      expect(pathsObj.arr[0]).toBe('goo.arr.0');
    });
    it('should return the correct path to a middle node with an array position nested object', () => {
      expect((pathsObj.arr[2] as { bor: string }).bor).toBe('goo.arr.2.bor');
    });
  });
});
