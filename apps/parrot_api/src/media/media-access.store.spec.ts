import { InMemoryMediaAccessStore } from './media-access.store.js';

describe('InMemoryMediaAccessStore', () => {
  it('consumes a token exactly once', () => {
    const store = new InMemoryMediaAccessStore();
    const token = store.issue('file-a.bin', 'hash-a', 1000);

    expect(store.consume(token, 'hash-a')).toEqual({
      storedFileName: 'file-a.bin',
      bindingHash: 'hash-a',
      expiresAt: expect.any(Date),
    });
    expect(store.consume(token, 'hash-a')).toBeUndefined();
  });

  it('rejects a binding hash mismatch', () => {
    const store = new InMemoryMediaAccessStore();
    const token = store.issue('file-b.bin', 'hash-b', 1000);

    expect(store.consume(token, 'wrong-hash')).toBeUndefined();
  });

  it('rejects an expired token', () => {
    const store = new InMemoryMediaAccessStore();
    const token = store.issue('file-c.bin', 'hash-c', -1);

    expect(store.consume(token, 'hash-c')).toBeUndefined();
  });

  it('rejects an unknown token', () => {
    const store = new InMemoryMediaAccessStore();

    expect(store.consume('no-such-token', 'hash-d')).toBeUndefined();
  });
});
