import type { CompletenessScore } from "../providers/types.js";

export function scoreCompleteness(text: string): CompletenessScore {
  const lower = text.toLowerCase();

  // Check for smart contract code
  const hasContract =
    /pragma solidity/i.test(text) ||
    /contract\s+\w+\s*\{/i.test(text) ||
    /anchor_lang/i.test(text) ||
    /program_id!/i.test(text) ||
    /#\[program\]/i.test(text) ||
    /module\s+\w+\s*\{/i.test(text);

  // Check for deployment script/instructions
  const hasDeployScript =
    /deploy/i.test(text) &&
    (/script/i.test(text) ||
      /npx\s+hardhat/i.test(text) ||
      /forge\s+(script|create|deploy)/i.test(text) ||
      /anchor\s+deploy/i.test(text) ||
      /migration/i.test(text));

  // Check for frontend code
  const hasFrontend =
    (/react|next\.?js|vue|svelte/i.test(text) &&
      /import/i.test(text)) ||
    /useState|useEffect|component/i.test(text) ||
    /\.tsx|\.jsx/i.test(text) ||
    /connect.*wallet/i.test(text);

  // Check for test code
  const hasTests =
    /describe\s*\(/i.test(text) ||
    /it\s*\(\s*["']/i.test(text) ||
    /expect\s*\(/i.test(text) ||
    /#\[test\]/i.test(text) ||
    /test.*\.js|test.*\.ts|\.test\./i.test(text) ||
    /forge test/i.test(text);

  // Count TODOs / placeholders
  const todoMatches = text.match(/TODO|FIXME|PLACEHOLDER|\/\/ \.\.\.|# \.\.\./gi);
  const todoCount = todoMatches?.length ?? 0;

  // Count code blocks as a proxy for substance
  const codeBlockCount = (text.match(/```/g)?.length ?? 0) / 2;

  // Calculate score
  let score = 0;

  // Contract: 0-35 points
  if (hasContract) {
    score += 25;
    // Bonus for substantial contract code (multiple functions)
    const functionCount = (
      text.match(/function\s+\w+|pub\s+fn\s+\w+|entry\s+fun\s+\w+/gi) ?? []
    ).length;
    score += Math.min(functionCount * 2, 10);
  }

  // Deploy script: 0-20 points
  if (hasDeployScript) {
    score += 20;
  }

  // Frontend: 0-20 points
  if (hasFrontend) {
    score += 20;
  }

  // Tests: 0-15 points
  if (hasTests) {
    score += 15;
  }

  // Code substance bonus: 0-10 points
  score += Math.min(Math.floor(codeBlockCount) * 2, 10);

  // TODO penalty: -2 per TODO, min 0
  score = Math.max(0, score - todoCount * 2);

  // Cap at 100
  score = Math.min(score, 100);

  return {
    score,
    hasContract,
    hasDeployScript,
    hasFrontend,
    hasTests,
    todoCount,
  };
}
