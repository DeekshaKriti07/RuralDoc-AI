const fs = require('fs');
const path = require('path');
const aiProvider = require('../model/provider');

const PROMPT_PATH = path.join(__dirname, '../prompts/clinical_note_v1.txt');
const PROMPT_TEMPLATE = fs.readFileSync(PROMPT_PATH, 'utf8');

// Extracts the first valid JSON object from a text blob.
// Local LLMs sometimes wrap JSON in extra text despite instructions -
// this makes generation more robust without trusting the model blindly.
function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in AI response');
  }
  const jsonStr = text.slice(start, end + 1);
  return JSON.parse(jsonStr);
}

const REQUIRED_FIELDS = ['chief_complaint', 'history', 'examination', 'assessment', 'follow_up'];

function validateNoteShape(obj) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in obj)) {
      throw new Error(`AI output missing required field: ${field}`);
    }
    if (typeof obj[field] !== 'string') {
      throw new Error(`AI output field "${field}" must be a string`);
    }
  }
}

/**
 * Generates a structured clinical note draft from raw practitioner text.
 * This NEVER writes to the database - it only returns a draft for review.
 */
async function generateNoteDraft(inputText) {
  const prompt = PROMPT_TEMPLATE.replace('{{INPUT_TEXT}}', inputText);

  const result = await aiProvider.generate(prompt, { temperature: 0.2 });
  const parsed = extractJson(result.text);
  validateNoteShape(parsed);

  return {
    draft: parsed,
    original_input: inputText,
    ai_model_name: result.model,
    ai_prompt_version: result.promptVersion,
  };
}

module.exports = { generateNoteDraft };