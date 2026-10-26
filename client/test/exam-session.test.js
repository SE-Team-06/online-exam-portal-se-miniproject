import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clockOffset, formatRemaining, remainingSeconds, submissionSummary } from '../src/exam-session.js';

describe('exam timer uses server time (NFR-OE-010)', () => {
  it('computes the offset between server and device clocks', () => {
    assert.equal(clockOffset('2026-10-26T10:00:05.000Z', Date.parse('2026-10-26T10:00:00.000Z')), 5000);
    assert.equal(clockOffset('2026-10-26T09:59:00.000Z', Date.parse('2026-10-26T10:00:00.000Z')), -60_000);
    assert.equal(clockOffset(undefined, 1000), 0);
  });

  it('counts down against the server clock even when the device clock is wrong', () => {
    const endsAt = '2026-10-26T10:10:00.000Z';
    const deviceNow = Date.parse('2026-10-26T10:05:00.000Z');
    assert.equal(remainingSeconds(endsAt, deviceNow, 0), 300);
    assert.equal(remainingSeconds(endsAt, deviceNow, 120_000), 180);
    assert.equal(remainingSeconds(endsAt, deviceNow, 600_000), 0);
  });

  it('formats remaining time as mm:ss, adding hours when needed', () => {
    assert.equal(formatRemaining(65), '01:05');
    assert.equal(formatRemaining(0), '00:00');
    assert.equal(formatRemaining(3725), '1:02:05');
  });
});

describe('submit confirmation summary (FR-OE-019)', () => {
  const questions = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];

  it('counts unanswered and flagged questions', () => {
    assert.deepEqual(submissionSummary(questions, { q1: 'a', q2: null }, { q1: true, q3: true }), { total: 3, unanswered: 2, flagged: 2 });
  });

  it('reports nothing outstanding when every question is answered and none flagged', () => {
    assert.deepEqual(submissionSummary(questions, { q1: 'a', q2: 'b', q3: 'c' }, {}), { total: 3, unanswered: 0, flagged: 0 });
  });
});
