// @google/genai ships as an ES Module, but the rest of this backend uses
// CommonJS (require/module.exports). Node won't let a CommonJS file
// `require()` an ESM-only package, so we load it lazily with a dynamic
// import() instead, and cache the client so it's only created once.
const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

let aiClientPromise = null;
function getAiClient() {
  if (!aiClientPromise) {
    aiClientPromise = import("@google/genai").then(
      ({ GoogleGenAI }) => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    );
  }
  return aiClientPromise;
}

// Generic helper: calls Gemini and forces the response to match a
// JSON schema, so we never have to "hope" the model returns valid JSON.
async function generateStructured({ prompt, schema }) {
  const ai = await getAiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  return JSON.parse(response.text);
}

// ---------- 1. Skill-gap analysis ----------
const skillGapSchema = {
  type: "OBJECT",
  properties: {
    matchScore: { type: "NUMBER", description: "0-100 how well the resume matches the job description" },
    matchedSkills: { type: "ARRAY", items: { type: "STRING" } },
    missingSkills: { type: "ARRAY", items: { type: "STRING" } },
    summary: { type: "STRING", description: "2-3 sentence honest summary of fit" },
  },
  required: ["matchScore", "matchedSkills", "missingSkills", "summary"],
};

async function analyzeSkillGap(resumeText, jobDescription) {
  const prompt = `You are an expert technical recruiter and career coach.

Compare the RESUME below against the JOB DESCRIPTION below.
Return a match score from 0-100, a list of skills from the job description
that the resume already demonstrates, a list of important skills/requirements
from the job description that are missing or weak in the resume, and a short
honest summary of the candidate's fit for this role.

RESUME:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""`;

  return generateStructured({ prompt, schema: skillGapSchema });
}

// ---------- 2. Interview question generation ----------
const interviewQuestionsSchema = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          type: { type: "STRING", enum: ["technical", "behavioral"] },
          idealAnswerTips: { type: "STRING", description: "1-2 sentence tip on how to approach answering well" },
          suggestedAnswer: {
            type: "STRING",
            description:
              "A concrete, well-structured sample answer (3-6 sentences) written in first person, using the candidate's real experience from their resume. For behavioral questions, follow the STAR method (Situation, Task, Action, Result). For technical questions, give a clear, correct explanation and, where relevant, mention a specific project from the resume as evidence.",
          },
        },
        required: ["question", "type", "idealAnswerTips", "suggestedAnswer"],
      },
    },
  },
  required: ["questions"],
};

async function generateInterviewQuestions(resumeText, jobDescription) {
  const prompt = `You are an interview coach preparing a candidate for a real interview.

Based on the RESUME and JOB DESCRIPTION below, generate 8 interview questions:
5 technical questions specific to the skills/tools mentioned in the job description,
and 3 behavioral questions relevant to the seniority/role.

For each question, provide:
1. A short tip on how to approach answering it well.
2. A sample answer written in first person, as if the candidate is speaking, that
   genuinely uses details from their resume (real projects, tools, or experience they
   mentioned). For behavioral questions, structure the sample answer using the STAR
   method (Situation, Task, Action, Result).

   IMPORTANT - do not fabricate specifics: only mention a specific number, metric,
   percentage, or statistic (e.g. "12% reduction", "team of 8") if that exact figure
   literally appears in the RESUME text below. If the resume does not contain a
   relevant number, describe the impact qualitatively instead (e.g. "significantly
   reduced waste") rather than inventing a precise figure. It is better to be honest
   and general than specific and false.

RESUME:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""`;

  return generateStructured({ prompt, schema: interviewQuestionsSchema });
}

// ---------- 3. ATS-optimized resume generation ----------
const atsResumeSchema = {
  type: "OBJECT",
  properties: {
    html: {
      type: "STRING",
      description: "A complete, self-contained HTML document (with inline <style>) for a clean, single-column, ATS-friendly resume tailored to the job description.",
    },
  },
  required: ["html"],
};

async function generateAtsResume(resumeText, jobDescription) {
  const prompt = `You are a professional resume writer specializing in ATS
(Applicant Tracking System) optimized resumes.

Rewrite the candidate's resume content below into a clean, single-column,
ATS-friendly resume tailored to the job description. Use simple semantic HTML
(h1, h2, p, ul/li) with a small inline <style> block for basic formatting only
(no external CSS/JS, no images, no tables, no multi-column layouts, as these
break ATS parsers). Naturally incorporate relevant keywords from the job
description where truthful and supported by the original resume content.
Do not invent experience that isn't implied by the original resume.

ORIGINAL RESUME CONTENT:
"""
${resumeText}
"""

TARGET JOB DESCRIPTION:
"""
${jobDescription}
"""

Return a single complete HTML document as the "html" field.`;

  return generateStructured({ prompt, schema: atsResumeSchema });
}

module.exports = {
  analyzeSkillGap,
  generateInterviewQuestions,
  generateAtsResume,
};
