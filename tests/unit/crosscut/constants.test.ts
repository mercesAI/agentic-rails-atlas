import { describe, expect, it } from 'vitest';
import { FAMILY_LABELS, LAYERS, LAYER_LABELS, PROTOCOL_SLUGS, RADAR_AXES } from '../../../src/lib/schemas';
import { C_FAMILY_LABELS, C_LAYERS, C_LAYER_LABELS, C_PROTOCOL_SLUGS, C_RADAR_AXES } from '../../../src/components/crosscut/lib/constants';

describe('client-safe constants mirror the schemas', () => {
  it('match', () => {
    expect([...C_PROTOCOL_SLUGS]).toEqual([...PROTOCOL_SLUGS]);
    expect([...C_LAYERS]).toEqual([...LAYERS]);
    expect(C_LAYER_LABELS).toEqual(LAYER_LABELS);
    expect([...C_RADAR_AXES]).toEqual([...RADAR_AXES]);
    expect(C_FAMILY_LABELS).toEqual(FAMILY_LABELS);
  });
});
