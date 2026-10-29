export function negativeMarkPayload(enabled, value) {
  return enabled ? Number(value) : 0;
}

export function validateNegativeMark(enabled, value) {
  if (!enabled) return '';
  const deduction = Number(value);
  if (!Number.isFinite(deduction) || deduction <= 0 || deduction > 100) return 'Enter a negative mark greater than 0 and at most 100, or turn negative marking off.';
  return '';
}

export function describeNegativeMarking(negativeMark) {
  const deduction = Number(negativeMark) || 0;
  return deduction > 0 ? `−${deduction} per wrong answer` : 'No negative marking';
}
