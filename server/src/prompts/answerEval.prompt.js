/**
 * Builds a prompt for evaluating a candidate's answer to an interview question.
 *
 * @param {string} question - The interview question
 * @param {string[]} expectedTopics - Topics a strong answer should cover
 * @param {string} userAnswer - The candidate's answer
 * @param {string} role - Target role (SDE, Data, PM, etc.)
 * @returns {string} - The prompt to send to Gemini
 */
export const buildAnswerEvalPrompt = (question, expectedTopics, userAnswer, role) => `
You are an expert ${role} interviewer evaluating a candidate's answer.

QUESTION:
"""
${question}
"""

EXPECTED TOPICS (a strong answer should cover these):
${expectedTopics.map(t => `- ${t}`).join('\n')}

CANDIDATE'S ANSWER:
"""
${userAnswer}
"""

EVALUATE THE ANSWER on three dimensions, each scored 1-10:

1. **content** (1-10): Did they cover the expected topics? Were the facts correct?
2. **structure** (1-10): Was the answer organized? Easy to follow? Used framework (e.g., STAR for behavioral)?
3. **technicalDepth** (1-10): Did they go beyond surface-level? Show real understanding?

SCORING GUIDE:
- 9-10: Excellent — would pass a top-company interview
- 7-8: Good — solid but missed some depth
- 5-6: Average — covered basics, missed key points
- 3-4: Weak — major gaps or errors
- 1-2: Poor — fundamentally incorrect or off-topic

YOUR TASK:
1. Score the answer on each dimension
2. Write 2-3 sentences of specific feedback (what they did well, what to improve)
3. Provide an IDEAL ANSWER (3-5 sentences max) showing what a strong response looks like

RESPOND WITH ONLY VALID JSON in this exact schema (no markdown, no preamble):
{
  "scores": {
    "content": 8,
    "structure": 7,
    "technicalDepth": 6
  },
  "feedback": "Your specific feedback here, addressing strengths and gaps.",
  "idealAnswer": "Your ideal answer here, 3-5 sentences showcasing strong technique."
}

The scores must be integers between 1 and 10. The feedback must be specific to THIS answer, not generic.
`;