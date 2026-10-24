import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileCorrectOptionId, validateQuestionDraft } from '../src/question-form.js';

const optionsFrom = (texts) => texts
  .map((text, index) => ({ id: String.fromCharCode(97 + index), text: text.trim() }))
  .filter((option) => option.text);

describe('correct answer selection', () => {
  it('keeps the selected answer while its option still has text', () => {
    assert.equal(reconcileCorrectOptionId(['First', 'Second', 'Third', ''], 'c'), 'c');
  });

  it('selects the first remaining option when the selected optional answer is cleared', () => {
    assert.equal(reconcileCorrectOptionId(['First', 'Second', '', ''], 'c'), 'a');
  });

  it('preserves the selection when a different optional answer is cleared', () => {
    assert.equal(reconcileCorrectOptionId(['First', 'Second', 'Third', ''], 'a'), 'a');
  });

  it('leaves no selection when every option is empty', () => {
    assert.equal(reconcileCorrectOptionId(['', '', '', ''], 'a'), '');
  });

  it('rejects empty and one-option drafts', () => {
    const minimumOptionsError = 'Enter at least two non-empty answer options.';
    assert.equal(validateQuestionDraft(optionsFrom(['', '', '', '']), ''), minimumOptionsError);
    assert.equal(validateQuestionDraft(optionsFrom(['Only option', '', '', '']), 'a'), minimumOptionsError);
  });

  it('rejects a draft when its correct answer is not among its non-empty options', () => {
    assert.equal(validateQuestionDraft(optionsFrom(['First', '', '', '']), 'b'), 'Enter at least two non-empty answer options.');
    assert.equal(validateQuestionDraft(optionsFrom(['First', 'Second', '', '']), 'c'), 'Select a correct answer from the non-empty options.');
  });

  it('accepts two or more options with a valid correct answer', () => {
    assert.equal(validateQuestionDraft(optionsFrom(['First', 'Second', 'Third', '']), 'c'), '');
  });
});
