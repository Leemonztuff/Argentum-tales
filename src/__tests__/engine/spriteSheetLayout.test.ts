import { describe, it, expect } from 'vitest';
import { bandStarts, cleanTinyBands, medianBandStride } from '../../engine/Game3DRenderer';

// Reference grid measured on the real 1295x1295 WebP body sheets:
//   rows   : content bands at 0-318, 325-643, 650-968, 975-1293  → starts [0, 325, 650, 975]
//   columns: content within cells on the same 325px grid
const ROW_STARTS = [0, 325, 650, 975];
const SIZE = 1295;

describe('sprite sheet grid detection', () => {
  it('detects 4 row bands on the WebP body sheet stride', () => {
    // Rows that carry no opaque pixels sit in the gutters between frames.
    const counts = new Array<number>(SIZE).fill(0);
    for (const [a, b] of [
      [0, 318],
      [325, 643],
      [650, 968],
      [975, 1293],
    ] as Array<[number, number]>) {
      for (let i = a; i <= b; i++) counts[i] = 512;
    }
    expect(bandStarts(counts, SIZE, 0)).toEqual([0, 325, 650, 975]);
  });

  it('derives the shared ~325px stride including the 5px gutters', () => {
    expect(medianBandStride(ROW_STARTS, SIZE)).toBe(325);
  });

  it('treats a classic width/4 sheet as stride = width/4', () => {
    const starts = [0, 64, 128, 192];
    expect(medianBandStride(starts, 256)).toBe(64);
  });

  it('removes gutter noise so stray pixels never distort the grid', () => {
    // A tiny band (from one stray pixel in a gutter) is dropped, keeping the
    // real 4 frame cells intact.
    const bands = [0, 320, 325, 650, 975];
    expect(cleanTinyBands(bands, SIZE, 64)).toEqual([0, 325, 650, 975]);
  });
});