import { z } from 'zod';

export const resumePdfSchema = z.object({
    html: z.string().describe('The full HTML document of the tailored resume, renderable to PDF via Puppeteer'),
});

export const buildResumePdfPrompt = (resumeText, jobDescription) => `
Generate a tailored, ATS-friendly resume as HTML for the following candidate.

CANDIDATE'S EXISTING RESUME TEXT:
"""
${resumeText}
"""

TARGET JOB DESCRIPTION (tailor the resume to this; if blank, produce a strong general-purpose resume):
"""
${jobDescription || 'N/A — no specific job description provided.'}
"""

Rules:
- The resume should not sound AI-generated; write it the way a strong human candidate would.
- ATS-friendly: parsable structure, no images, no layout tricks that break text extraction.
- Simple, professional visual design; subtle color or font-weight accents are fine.
- Ideally 1-2 pages when rendered to PDF. Prioritize quality and relevance over length.
- Highlight strengths and experience most relevant to the target job description.

Respond with only valid JSON matching this schema (no markdown, no preamble):
{ "html": "<the full HTML document as a string>" }
`;
