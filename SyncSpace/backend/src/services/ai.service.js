'use strict';

const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const MAX_CONTENT_CHARS = 50000; // ~12k tokens

/**
 * Extract plain text from TipTap JSON content for AI processing.
 * Never logs the content itself.
 */
const extractText = (content) => {
  if (!content) return '';
  if (typeof content === 'string') return content.slice(0, MAX_CONTENT_CHARS);

  const walk = (node) => {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(walk).join(' ');
    }
    return '';
  };

  return walk(content).replace(/\s+/g, ' ').trim().slice(0, MAX_CONTENT_CHARS);
};

const PROMPT_TEMPLATES = {
  short: (text) => `Summarize this document in 2-3 concise sentences:\n\n${text}`,
  medium: (text) => `Write a clear summary of this document in 1-2 paragraphs covering the main ideas:\n\n${text}`,
  detailed: (text) => `Write a comprehensive summary of this document including all main topics and key details:\n\n${text}`,
  key_points: (text) => `Extract the key points from this document as a bulleted list:\n\n${text}`,
  action_items: (text) => `Extract all action items, tasks, or next steps from this document as a bulleted list. If none exist, say "No action items found.":\n\n${text}`,
};

/**
 * Call the configured AI provider.
 * Currently supports: gemini (Google Generative AI)
 */
const callAIProvider = async (prompt) => {
  const provider = process.env.AI_PROVIDER || 'gemini';
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new AppError(
      'AI summarization is not configured. Set AI_API_KEY in the backend environment.',
      503
    );
  }

  if (provider === 'gemini') {
    return callGemini(prompt, apiKey);
  }

  throw new AppError(`Unknown AI provider: ${provider}. Set AI_PROVIDER=gemini`, 503);
};

const callGemini = async (prompt, apiKey) => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);

  const candidateModels = [
    process.env.AI_MODEL,
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
  ].filter(Boolean);

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      lastError = err;
      // If model not found, sunset, overloaded (503), or high demand, try next fallback
      if (
        err.message?.includes('404') ||
        err.message?.includes('not found') ||
        err.message?.includes('no longer available') ||
        err.message?.includes('503') ||
        err.message?.includes('high demand') ||
        err.message?.includes('temporarily')
      ) {
        logger.warn(`Model ${modelName} unavailable, falling back...`);
        continue;
      }
      if (
        err.message?.includes('API_KEY_INVALID') ||
        err.message?.includes('API key not valid')
      ) {
        throw new AppError('Invalid Gemini API key. Please check your AI_API_KEY in .env', 401);
      }
      if (err.message?.includes('429')) {
        throw new AppError('AI rate limit reached. Please try again later.', 429);
      }
      if (err.message?.includes('quota')) {
        throw new AppError('AI quota exceeded. Please check your Gemini account quota.', 429);
      }
      break;
    }
  }

  if (lastError instanceof AppError) throw lastError;
  logger.warn('AI provider error:', lastError?.message);
  throw new AppError(lastError?.message || 'AI provider error. Please try again.', 502);
};

/**
 * Generate a summary for the given document text.
 * @param {object} options
 * @param {object} options.content - TipTap JSON content
 * @param {string} options.summaryType - short|medium|detailed|key_points|action_items
 */
const generateSummary = async ({ content, summaryType }) => {
  const text = extractText(content);

  if (!text || text.trim().length < 10) {
    throw new AppError('Document is too short or empty to summarize', 400);
  }

  const buildPrompt = PROMPT_TEMPLATES[summaryType];
  if (!buildPrompt) throw new AppError(`Invalid summary type: ${summaryType}`, 400);

  const prompt = buildPrompt(text);
  return callAIProvider(prompt);
};

module.exports = { generateSummary, extractText };
