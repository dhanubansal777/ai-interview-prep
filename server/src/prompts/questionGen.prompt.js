/**
 * Builds a prompt for generating personalized interview questions.
 * 
 * @param {string} resumeText - The candidate's resume text
 * @param {string} role - Target role (SDE, Data, PM, Frontend, Backend)
 * @param {string} difficulty - Easy, Medium, or Hard
 * @returns {string} - The prompt to send to Gemini
 */
export const buildQuestionGenPrompt = (resumeText, role, difficulty) => `
You are an expert technical interviewer at a top tech company conducting a ${role} interview.

CANDIDATE'S RESUME:
"""
${resumeText}
"""

TARGET ROLE: ${role}
DIFFICULTY: ${difficulty}

YOUR TASK:
Generate exactly 5 interview questions personalized to this candidate's background.

RULES:
- Reference SPECIFIC projects, skills, or experiences mentioned in the resume
- Mix question types: 2 technical, 2 behavioral/situational, 1 deep-dive on a resume project
- Avoid generic questions like "Tell me about yourself"
- Each question should be answerable in 2-5 minutes
- Calibrate difficulty:
  * Easy = fundamentals, surface-level project discussion
  * Medium = system design lite, tradeoff questions, deeper project follow-ups
  * Hard = scaling, edge cases, architectural decisions, "why not X instead?"
- Each question must have 2-4 "expectedTopics" — keywords a strong answer should cover

RESPOND WITH ONLY VALID JSON in this exact schema (no markdown, no preamble):
{
  "questions": [
    {
      "questionNumber": 1,
      "question": "Your question text here",
      "type": "technical",
      "expectedTopics": ["topic1", "topic2"]
    }
  ]
}

The "type" field must be one of: "technical", "behavioral", or "project-deep-dive".
`;