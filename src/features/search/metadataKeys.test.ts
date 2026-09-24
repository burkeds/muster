import { describe, expect, it } from 'vitest';
import { collectMetadataKeys } from './metadataKeys';

describe('collectMetadataKeys', () => {
  it('collects top-level and nested dotted keys', () => {
    const keys = collectMetadataKeys([
      {
        edges: { K: { energy_eV: 24.6, jump_ratio: 1 } },
        element: { name: 'helium', symbol: 'He' },
      },
    ]);
    expect(keys).toEqual(
      expect.arrayContaining([
        'edges',
        'edges.K',
        'edges.K.energy_eV',
        'edges.K.jump_ratio',
        'element',
        'element.name',
        'element.symbol',
      ]),
    );
  });

  it('deduplicates and sorts keys across multiple nodes', () => {
    const keys = collectMetadataKeys([
      { element: { name: 'helium' } },
      { element: { name: 'iron' }, extra: 1 },
      undefined,
    ]);
    expect(keys).toEqual(['element', 'element.name', 'extra']);
  });
});
