export function clockOffset(serverTime, receivedAt = Date.now()) {
  const serverMs = new Date(serverTime).getTime();
  return Number.isFinite(serverMs) ? serverMs - receivedAt : 0;
}

export function remainingSeconds(endsAt, clientNowMs, offsetMs = 0) {
  const endMs = new Date(endsAt).getTime();
  if (!Number.isFinite(endMs)) return 0;
  return Math.max(0, Math.ceil((endMs - (clientNowMs + offsetMs)) / 1000));
}

export function formatRemaining(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const mmss = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return hours ? `${hours}:${mmss}` : mmss;
}

export function submissionSummary(questions, answers, flags) {
  return {
    total: questions.length,
    unanswered: questions.filter((question) => answers[question.id] == null).length,
    flagged: questions.filter((question) => flags[question.id]).length,
  };
}
