import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateScore } from '../src/domain/scoring.js';

describe('score calculation', () => {
  const questions = [{ _id: '1', correctOptionId: 'a', marks: 2 }, { _id: '2', correctOptionId: 'b', marks: 3 }];
  it('awards marks for correct answers and passes at the threshold', () => {
    const result = calculateScore(questions, [{ questionId: '1', selectedOptionId: 'a' }, { questionId: '2', selectedOptionId: 'b' }], 1, 5);
    assert.deepEqual([result.score, result.maximumScore, result.passed, result.correctCount, result.unansweredCount], [5, 5, true, 2, 0]);
  });
  it('deducts wrong answers but floors a negative score at zero', () => {
    const result = calculateScore(questions, [{ questionId: '1', selectedOptionId: 'x' }, { questionId: '2', selectedOptionId: 'x' }], 4, 1);
    assert.deepEqual([result.score, result.passed, result.wrongCount], [0, false, 2]);
  });
  it('counts unanswered questions without awarding marks', () => {
    const result = calculateScore(questions, [{ questionId: '1', selectedOptionId: null }], 0, 1);
    assert.deepEqual([result.score, result.unansweredCount], [0, 2]);
  });
  it('applies no deduction when negative marking is disabled', () => {
    const result = calculateScore(questions, [{ questionId: '1', selectedOptionId: 'a' }, { questionId: '2', selectedOptionId: 'x' }], 0, 1);
    assert.deepEqual([result.score, result.correctCount, result.wrongCount], [2, 1, 1]);
  });
  it('never penalises unanswered questions when negative marking is enabled', () => {
    const result = calculateScore(questions, [{ questionId: '1', selectedOptionId: 'a' }], 1, 1);
    assert.deepEqual([result.score, result.wrongCount, result.unansweredCount], [2, 0, 1]);
  });
  it('keeps full marks for correct answers and deducts only per wrong answer', () => {
    const three = [...questions, { _id: '3', correctOptionId: 'c', marks: 4 }];
    const result = calculateScore(three, [{ questionId: '1', selectedOptionId: 'a' }, { questionId: '2', selectedOptionId: 'x' }, { questionId: '3', selectedOptionId: 'c' }], 0.5, 1);
    assert.deepEqual([result.score, result.maximumScore, result.correctCount, result.wrongCount], [5.5, 9, 2, 1]);
  });
});
