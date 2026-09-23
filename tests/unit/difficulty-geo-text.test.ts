import { describe, expect, it } from 'vitest';
import { performance, recommend } from '@/server/domain/difficulty';
import { classifyPing, haversineM, isGeofenceBreach } from '@/server/domain/geo';
import { bestMatch, levenshtein, similarity } from '@/server/domain/text-match';

describe('difficulty engine', () => {
  it('scores a perfect, fast round near 1 and a failed round near 0', () => {
    const base = { game: 'memory_match', difficulty: 'easy' } as const;
    expect(performance({ ...base, score: 8, maxScore: 8, mistakes: 0, durationMs: 30_000 })).toBe(1);
    expect(performance({ ...base, score: 0, maxScore: 8, mistakes: 20, durationMs: 600_000 })).toBeLessThan(0.1);
  });

  it('promotes only after three strong sessions', () => {
    expect(recommend('easy', [0.9, 0.85]).change).toBe('hold');
    expect(recommend('easy', [0.9, 0.85, 0.82])).toMatchObject({ level: 'medium', change: 'promote' });
    expect(recommend('easy', [0.9, 0.85, 0.6]).reason).toBe('mixed_results');
  });

  it('demotes faster than it promotes', () => {
    expect(recommend('hard', [0.3, 0.4])).toMatchObject({ level: 'medium', change: 'demote' });
    expect(recommend('medium', [0.3, 0.9, 0.9]).change).toBe('hold');
  });

  it('holds at the boundaries', () => {
    expect(recommend('easy', [0.2, 0.2]).reason).toBe('at_boundary');
    expect(recommend('hard', [0.95, 0.95, 0.95]).reason).toBe('at_boundary');
  });
});

describe('geofencing', () => {
  const home = { lat: 12.9716, lng: 77.5946 };

  it('computes great-circle distance', () => {
    expect(haversineM(home, home)).toBe(0);
    // Bengaluru → Chennai ≈ 290 km
    expect(haversineM(home, { lat: 13.0827, lng: 80.2707 }) / 1000).toBeCloseTo(290, -1);
  });

  it('accounts for GPS accuracy before calling a ping outside', () => {
    const p = { lat: home.lat + 0.0035, lng: home.lng }; // ≈ 390 m north
    expect(classifyPing(home, 300, { ...p, accuracyM: 20 }).classification).toBe('outside');
    expect(classifyPing(home, 300, { ...p, accuracyM: 150 }).classification).toBe('uncertain');
    expect(classifyPing(home, 300, { ...home, accuracyM: 10 }).classification).toBe('inside');
  });

  it('debounces breaches over consecutive readings', () => {
    expect(isGeofenceBreach(['outside'])).toBe(false);
    expect(isGeofenceBreach(['outside', 'uncertain'])).toBe(false);
    expect(isGeofenceBreach(['outside', 'outside'])).toBe(true);
  });
});

describe('medicine name matching', () => {
  it('computes edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('ignores case, strength and punctuation', () => {
    expect(similarity('ARICEPT 5mg', 'Aricept')).toBe(1);
  });

  it('tolerates OCR typos but rejects different drugs', () => {
    const meds = [{ name: 'Donepezil (Aricept)' }, { name: 'Memantine' }, { name: 'Amlodipine' }];
    expect(bestMatch('Memantlne', meds)?.item.name).toBe('Memantine');
    expect(bestMatch('Paracetamol', meds)).toBeNull();
  });
});
