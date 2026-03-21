import logger from "../config/logger.js";
import { ValidationError } from "../lib/errors.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const validateRequiredPersonalInfo = (application) => {
  const info = application?.personalInfo || {};
  const requiredFields = ["firstname", "lastname", "email"];

  const missingFields = requiredFields.filter((field) => !String(info[field] || "").trim());
  if (missingFields.length) {
    throw new ValidationError(
      `Missing required personal info field(s): ${missingFields.join(", ")}. Update personal info before AI review.`,
    );
  }
};

const groqChatCompletion = async (messages, { temperature = 0.2, max_tokens = 700 } = {}) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const model = process.env.AI_MODEL || DEFAULT_MODEL;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("Groq API request failed", {
      status: response.status,
      errorBody,
    });
    throw new Error("AI provider request failed");
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned an empty response");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    logger.error("Failed to parse Groq JSON response", {
      error: error.message,
      content,
    });
    throw new Error("AI provider returned invalid structured response");
  }
};

export const reviewApplication = async (job, application) => {
  validateRequiredPersonalInfo(application);

  const promptPayload = {
    job: {
      title: job?.title,
      companyName: job?.companyName,
      requirements: job?.requirements,
      description: job?.description,
      jobType: job?.jobType,
      location: job?.location,
      applicationQuestions: job?.applicationQuestions,
    },
    application: {
      personalInfo: application?.personalInfo,
      portfolioUrl: application?.portfolioUrl,
      linkedinUrl: application?.linkedinUrl,
      answers: application?.answers,
    },
  };

  const result = await groqChatCompletion([
    {
      role: "system",
      content:
        "You are a hiring reviewer. Return strict JSON with keys score (0-100 number) and feedback (string).",
    },
    {
      role: "user",
      content: `Review this application against the job requirements. Explain top strengths and risks in <= 120 words. Data: ${JSON.stringify(promptPayload)}`,
    },
  ]);

  const score = Number(result?.score);
  const feedback = String(result?.feedback || "").trim();

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error("AI review score is invalid");
  }

  return {
    score: Math.round(score),
    feedback,
  };
};

export const generateInterviewQuestions = async (job, application) => {
  validateRequiredPersonalInfo(application);

  const payload = {
    job: {
      title: job?.title,
      requirements: job?.requirements,
      description: job?.description,
    },
    application: {
      answers: application?.answers,
      personalInfo: application?.personalInfo,
    },
  };

  const result = await groqChatCompletion([
    {
      role: "system",
      content:
        "You generate interview questions. Return JSON with key questions as an array of exactly 5 concise strings.",
    },
    {
      role: "user",
      content: `Generate behavioral and technical screening questions tailored to this candidate and role: ${JSON.stringify(payload)}`,
    },
  ]);

  const rawQuestions = Array.isArray(result?.questions) ? result.questions : [];

  if (!rawQuestions.length) {
    throw new Error("AI did not return interview questions");
  }

  return rawQuestions.slice(0, 5).map((question) => ({
    question: String(question || "").trim(),
    answer: "",
    score: null,
  })).filter((item) => item.question);
};

export const scoreInterviewAnswers = async (questionsWithAnswers = []) => {
  if (!Array.isArray(questionsWithAnswers) || questionsWithAnswers.length === 0) {
    throw new ValidationError("Interview answers are required");
  }

  const cleaned = questionsWithAnswers.map((item) => ({
    question: String(item?.question || "").trim(),
    answer: String(item?.answer || "").trim(),
  }));

  if (cleaned.some((item) => !item.answer)) {
    throw new ValidationError("Every interview question must have an answer");
  }

  const result = await groqChatCompletion([
    {
      role: "system",
      content:
        "You score interview answers. Return JSON with keys overallScore (0-100) and scores (number array matching question order).",
    },
    {
      role: "user",
      content: `Score each answer for relevance, clarity, and depth. Data: ${JSON.stringify(cleaned)}`,
    },
  ]);

  const perQuestionScores = Array.isArray(result?.scores) ? result.scores : [];
  const overallScore = Number(result?.overallScore);

  if (perQuestionScores.length !== cleaned.length) {
    throw new Error("AI returned invalid number of question scores");
  }

  const normalizedScores = perQuestionScores.map((score) => {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) {
      throw new Error("AI returned non-numeric question score");
    }
    return Math.max(0, Math.min(100, Math.round(numericScore)));
  });

  const normalizedOverallScore = Number.isFinite(overallScore)
    ? Math.max(0, Math.min(100, Math.round(overallScore)))
    : Math.round(normalizedScores.reduce((sum, value) => sum + value, 0) / normalizedScores.length);

  return {
    overallScore: normalizedOverallScore,
    scores: normalizedScores,
  };
};

export default {
  reviewApplication,
  generateInterviewQuestions,
  scoreInterviewAnswers,
};
