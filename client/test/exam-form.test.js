import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { describeNegativeMarking, negativeMarkPayload, validateNegativeMark } from '../src/exam-form.js';

describe('negative marking configuration', () => {
  it('sends zero when negative marking is turned off, whatever value was typed', () => {
    assert.equal(negativeMarkPayload(false, '0.5'), 0);
  });

  it('sends the configured deduction as a number when enabled', () => {
    assert.equal(negativeMarkPayload(true, '0.25'), 0.25);
  });

  it('requires a deduction above 0 and at most 100 only when enabled', () => {
    const error = 'Enter a negative mark greater than 0 and at most 100, or turn negative marking off.';
    assert.equal(validateNegativeMark(false, ''), '');
    assert.equal(validateNegativeMark(true, '0'), error);
    assert.equal(validateNegativeMark(true, ''), error);
    assert.equal(validateNegativeMark(true, '101'), error);
    assert.equal(validateNegativeMark(true, '0.5'), '');
  });

  it('describes the configured rule for the instructor exam list', () => {
    assert.equal(describeNegativeMarking(0), 'No negative marking');
    assert.equal(describeNegativeMarking(0.25), '−0.25 per wrong answer');
  });
});
