import { callGemma } from './cerebras';
import type { AgentAOutput, AgentBOutput, AgentCOutput, AgentDOutput } from './types';

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try { return await fn(); }
  catch (e) {
    if (retries > 0) return withRetry(fn, retries - 1);
    throw e;
  }
}

export async function runAgentA(params: {
  baselineDesktop: string;
  baselineMobile: string;
  buggedDesktop: string;
  buggedMobile: string;
  prDescription?: string; // optional PR intent context for GitHub App flow
}): Promise<AgentAOutput> {
  const intentContext = params.prDescription
    ? `\n\nPR context (intent declared by the author): "${params.prDescription}"\nIf a change clearly matches the declared intent (e.g. changing button color to red), mark it as intentional in intentional_changes_detected. Any other difference, even if small or seemingly unrelated, MUST be flagged as a regression.`
    : '\n\nAny visual difference, no matter how small, MUST be flagged as a regression.';

  return withRetry(() => callGemma<AgentAOutput>({
    systemPrompt: `You are a visual QA engineer specialising in UI regression detection.
You will be given BEFORE (baseline) and AFTER (post-deploy) screenshots of a web app at two viewports.
Your job is to identify any visual regressions — elements that are missing, hidden, shifted, broken, or have changed styling/color.
Focus especially on interactive elements like buttons, links, and form fields.${intentContext}

You MUST return JSON only, conforming exactly to this structure:
{
  "regression_found": true or false,
  "description": "description of the visual regression found",
  "affected_element": "name of the affected element (e.g. .button-wrapper)",
  "viewport": "desktop" or "mobile" or "both" or "none",
  "intentional_changes_detected": ["list of intentional changes detected based on PR context, or empty array"]
}
Do not add any wrapper keys. Conform strictly to these keys. No explanation outside the JSON.`,
    userContent: [
      { type: 'text', text: 'BASELINE — desktop (1440px):' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${params.baselineDesktop}` } },
      { type: 'text', text: 'BASELINE — mobile (375px):' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${params.baselineMobile}` } },
      { type: 'text', text: 'AFTER DEPLOY — desktop (1440px):' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${params.buggedDesktop}` } },
      { type: 'text', text: 'AFTER DEPLOY — mobile (375px):' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${params.buggedMobile}` } },
      { type: 'text', text: 'Identify any visual regressions between baseline and after-deploy.' },
    ],
    schemaName: 'agent_a_output',
    schema: {
      type: 'object',
      properties: {
        regression_found: { type: 'boolean' },
        description: { type: 'string' },
        affected_element: { type: 'string' },
        viewport: { type: 'string', enum: ['desktop', 'mobile', 'both', 'none'] },
        intentional_changes_detected: { type: 'array', items: { type: 'string' } },
      },
      required: ['regression_found', 'description', 'affected_element', 'viewport'],
      additionalProperties: false,
    },
  }));
}

export async function runAgentB(params: {
  regressionDescription: string;
  affectedElement: string;
  cssContent: string;
  cssDiff: string;
}): Promise<AgentBOutput> {
  return withRetry(() => callGemma<AgentBOutput>({
    systemPrompt: `You are a CSS root cause analyst.
You will be given a visual regression description and the CSS diff from the latest deploy.
Your job is to identify the exact CSS property change that caused the regression.

You MUST return JSON only, conforming exactly to this structure:
{
  "file": "path/to/css/file",
  "line": 123,
  "property": "name of css property",
  "old_value": "old value of property",
  "new_value": "new value of property",
  "explanation": "explanation of root cause",
  "confidence": 0.0 to 1.0
}
Conform strictly to these keys. No explanation outside the JSON.`,
    userContent: [
      { type: 'text', text: `Visual regression detected:\n${params.regressionDescription}\nAffected element: ${params.affectedElement}` },
      { type: 'text', text: `CSS diff from this deploy:\n\`\`\`diff\n${params.cssDiff}\n\`\`\`` },
      { type: 'text', text: `Full current CSS file content:\n\`\`\`css\n${params.cssContent}\n\`\`\`` },
      { type: 'text', text: 'Identify the exact CSS change that caused this regression.' },
    ],
    schemaName: 'agent_b_output',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string' },
        line: { type: 'number' },
        property: { type: 'string' },
        old_value: { type: 'string' },
        new_value: { type: 'string' },
        explanation: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['file', 'line', 'property', 'old_value', 'new_value', 'explanation', 'confidence'],
      additionalProperties: false,
    },
  }));
}

export async function runAgentC(params: {
  rootCause: AgentBOutput;
  cssContent: string;
}): Promise<AgentCOutput> {
  return withRetry(() => callGemma<AgentCOutput>({
    systemPrompt: `You are a CSS engineer fixing a visual regression.
You will be given the root cause analysis and the full CSS file.
Generate the minimal patch to fix the regression — change only what is necessary.

You MUST return JSON only, conforming exactly to this structure:
{
  "old_code": "exact lines of code to replace",
  "new_code": "exact lines of replacement code",
  "line": 123,
  "explanation": "explanation of the fix",
  "confidence": 0.0 to 1.0
}
Conform strictly to these keys. No explanation outside the JSON.`,
    userContent: [
      { type: 'text', text: `Root cause:\nFile: ${params.rootCause.file}\nLine: ${params.rootCause.line}\nProperty: ${params.rootCause.property}\nProblem value: ${params.rootCause.new_value}\nCorrect value: ${params.rootCause.old_value}\nExplanation: ${params.rootCause.explanation}` },
      { type: 'text', text: `Full CSS file:\n\`\`\`css\n${params.cssContent}\n\`\`\`` },
      { type: 'text', text: 'Generate the minimal CSS patch to fix this regression.' },
    ],
    schemaName: 'agent_c_output',
    schema: {
      type: 'object',
      properties: {
        old_code: { type: 'string' },
        new_code: { type: 'string' },
        line: { type: 'number' },
        explanation: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['old_code', 'new_code', 'line', 'explanation', 'confidence'],
      additionalProperties: false,
    },
  }));
}

export async function runAgentD(params: {
  baselineMobile: string;
  fixedMobile: string;
  regressionDescription: string;
}): Promise<AgentDOutput> {
  return withRetry(() => callGemma<AgentDOutput>({
    systemPrompt: `You are a visual QA engineer verifying that a CSS fix resolved a regression.
You will be given the original BASELINE screenshot and the FIXED screenshot after a patch was applied.
Confirm whether the regression described has been resolved. Check if the affected element (e.g., the "Proceed to Checkout" button) is no longer dimmed or covered by the dark overlay, and matches the baseline's bright blue style.

You MUST return JSON only, conforming exactly to this structure:
{
  "regression_resolved": true or false,
  "description": "description of verification result"
}
Conform strictly to these keys. No explanation outside the JSON.`,
    userContent: [
      { type: 'text', text: `The regression that was fixed: ${params.regressionDescription}` },
      { type: 'text', text: 'BASELINE (what it should look like):' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${params.baselineMobile}` } },
      { type: 'text', text: 'FIXED (after patch was applied):' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${params.fixedMobile}` } },
      { type: 'text', text: 'Does the fixed screenshot match the baseline? Is the regression resolved?' },
    ],
    schemaName: 'agent_d_output',
    schema: {
      type: 'object',
      properties: {
        regression_resolved: { type: 'boolean' },
        description: { type: 'string' },
      },
      required: ['regression_resolved', 'description'],
      additionalProperties: false,
    },
  }));
}
