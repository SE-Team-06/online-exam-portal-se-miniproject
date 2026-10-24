export function reconcileCorrectOptionId(optionTexts, selectedId) {
  const availableIds = optionTexts
    .map((text, index) => ({ id: String.fromCharCode(97 + index), text: text.trim() }))
    .filter((option) => option.text)
    .map((option) => option.id);

  if (availableIds.includes(selectedId)) return selectedId;
  return availableIds[0] ?? '';
}

export function validateQuestionDraft(options, correctOptionId) {
  if (options.length < 2) return 'Enter at least two non-empty answer options.';
  if (!options.some((option) => option.id === correctOptionId)) return 'Select a correct answer from the non-empty options.';
  return '';
}
