export function calculateScore(questions, answers, negativeMark = 0, passMark = 0) {
  const answerByQuestion = new Map(answers.map((answer) => [String(answer.questionId), answer.selectedOptionId]));
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  for (const question of questions) {
    const selected = answerByQuestion.get(String(question._id ?? question.id));
    if (selected == null || selected === '') {
      unansweredCount += 1;
    } else if (String(selected) === String(question.correctOptionId)) {
      score += question.marks;
      correctCount += 1;
    } else {
      score -= negativeMark;
      wrongCount += 1;
    }
  }

  score = Math.max(0, score);
  const maximumScore = questions.reduce((total, question) => total + question.marks, 0);
  return {
    score,
    maximumScore,
    passed: score >= passMark,
    correctCount,
    wrongCount,
    unansweredCount,
  };
}
