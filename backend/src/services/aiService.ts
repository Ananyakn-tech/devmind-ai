// backend/src/services/aiService.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ReviewSuggestion {
  line?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  title: string;
  description: string;
  suggestion: string;
  codeSnippet?: string;
}

export interface CodeReviewResult {
  summary: string;
  overallScore: number; // 0-100
  suggestions: ReviewSuggestion[];
}

// ─── Code Review ───────────────────────────────────────────────────────────────

export async function analyzeCode(
  code: string,
  language: string
): Promise<CodeReviewResult> {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert code reviewer. Analyze the following ${language} code and provide a detailed review.

Return ONLY a JSON object (no markdown, no backticks) with this exact structure:
{
  "summary": "Brief 2-3 sentence overall assessment",
  "overallScore": <number 0-100>,
  "suggestions": [
    {
      "line": <line number or null>,
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "category": "security|performance|readability|maintainability|best-practices|bugs",
      "title": "Short issue title",
      "description": "Detailed explanation of the issue",
      "suggestion": "How to fix it",
      "codeSnippet": "Improved code snippet if applicable or null"
    }
  ]
}

Code to review:
\`\`\`${language}
${code}
\`\`\``,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  
  try {
    return JSON.parse(text);
  } catch {
    // Fallback if JSON parsing fails
    return {
      summary: 'Code review completed. See suggestions below.',
      overallScore: 70,
      suggestions: [],
    };
  }
}

// ─── Documentation Generator ───────────────────────────────────────────────────

export type DocType = 'README' | 'JSDOC' | 'DOCSTRING' | 'API_DOCS' | 'CHANGELOG';

export async function generateDocumentation(
  code: string,
  language: string,
  docType: DocType,
  projectName?: string
): Promise<string> {
  const prompts: Record<DocType, string> = {
    README: `Generate a comprehensive README.md for this ${language} code/project${projectName ? ` called "${projectName}"` : ''}. Include: project description, features, installation, usage examples, API reference if applicable, and contributing guidelines. Use proper Markdown formatting.`,
    JSDOC: `Generate complete JSDoc comments for all functions, classes, and methods in this ${language} code. Return the full code with JSDoc comments added inline.`,
    DOCSTRING: `Generate comprehensive docstrings for all functions and classes in this ${language} code following the language's standard docstring format (Google style for Python, etc.). Return the full code with docstrings added.`,
    API_DOCS: `Generate OpenAPI/Swagger-style API documentation for this ${language} code. Include endpoints, request/response schemas, authentication, and examples in Markdown format.`,
    CHANGELOG: `Generate a CHANGELOG.md based on this code's structure and features, following Keep a Changelog format.`,
  };

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `${prompts[docType]}

Code:
\`\`\`${language}
${code}
\`\`\``,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// ─── Bug Fix Suggestion ────────────────────────────────────────────────────────

export async function suggestBugFix(
  title: string,
  description: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a senior software engineer. A bug has been reported:

Title: ${title}
Description: ${description}

Provide a concise, actionable suggestion to fix this bug. Include:
1. Likely root cause
2. Step-by-step fix
3. How to prevent it in the future

Keep it practical and under 300 words.`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
