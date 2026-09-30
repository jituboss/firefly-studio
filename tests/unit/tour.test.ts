import { describe, expect, it } from 'vitest';
import { TOUR_STEPS, nextTourState, parseTourState } from '@/lib/tour';

describe('parseTourState', () => {
  it('is null for anything that is not a stored state — never offered', () => {
    expect(parseTourState(null)).toBeNull();
    expect(parseTourState({})).toBeNull();
    expect(parseTourState({ status: 'paused', step: 1 })).toBeNull();
  });

  it('clamps the step into range and defaults a bad one to the start', () => {
    expect(parseTourState({ status: 'active', step: 999 })?.step).toBe(TOUR_STEPS.length - 1);
    expect(parseTourState({ status: 'active', step: -3 })?.step).toBe(0);
    expect(parseTourState({ status: 'active', step: 1.5 })?.step).toBe(0);
  });
});

describe('nextTourState', () => {
  it('walks forward and completes after the last step', () => {
    let state = nextTourState(null, 'start');
    expect(state).toEqual({ status: 'active', step: 0 });
    for (let i = 1; i < TOUR_STEPS.length; i += 1) {
      state = nextTourState(state, 'next');
      expect(state).toEqual({ status: 'active', step: i });
    }
    expect(nextTourState(state, 'next').status).toBe('done');
  });

  it('resumes a dismissed tour where it stopped', () => {
    const dismissed = nextTourState({ status: 'active', step: 3 }, 'dismiss');
    expect(dismissed).toEqual({ status: 'dismissed', step: 3 });
    expect(nextTourState(dismissed, 'start')).toEqual({ status: 'active', step: 3 });
  });

  it('restarts a finished tour from the beginning', () => {
    expect(nextTourState({ status: 'done', step: 0 }, 'start')).toEqual({
      status: 'active',
      step: 0,
    });
    expect(nextTourState({ status: 'active', step: 2 }, 'finish').status).toBe('done');
  });

  it('never steps back past the first step', () => {
    expect(nextTourState({ status: 'active', step: 0 }, 'back').step).toBe(0);
    expect(nextTourState({ status: 'active', step: 2 }, 'back').step).toBe(1);
  });
});
