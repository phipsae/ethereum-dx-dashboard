import type { BehaviorClassification } from "../providers/types.js";

const QUESTION_PATTERNS = [
  /\?\s*$/m, // Lines ending with ?
  /would you (like|prefer|want)/i,
  /do you (want|need|have)/i,
  /which (one|option|approach|framework)/i,
  /should (I|we) (use|go|choose)/i,
  /what (kind|type|sort) of/i,
  /could you (clarify|specify|tell)/i,
  /before (I|we) (proceed|start|begin|continue)/i,
  /a few questions/i,
  /let me (ask|clarify|know)/i,
];

const DECISION_PATTERNS = [
  { pattern: /I'll use (\w[\w\s./-]*)/gi, extract: true },
  { pattern: /let's (use|go with|build with|choose|pick) (\w[\w\s./-]*)/gi, extract: true },
  { pattern: /I'?m going to use (\w[\w\s./-]*)/gi, extract: true },
  { pattern: /we'll use (\w[\w\s./-]*)/gi, extract: true },
  { pattern: /using (\w+) (framework|library|tool|SDK)/gi, extract: true },
  { pattern: /I'll (create|build|implement|set up|deploy)/gi, extract: true },
  { pattern: /here's (the|a|my) (complete|full|working)/gi, extract: false },
];

export function classifyBehavior(text: string): BehaviorClassification {
  // Count questions
  let questionsAsked = 0;
  for (const pattern of QUESTION_PATTERNS) {
    const matches = text.match(new RegExp(pattern, "gi"));
    if (matches) {
      questionsAsked += matches.length;
    }
  }

  // Deduplicate: lines ending in ? is broad, so cap it
  const questionLineMatches = text.match(/\?\s*$/gm);
  const rawQuestionLines = questionLineMatches?.length ?? 0;
  // Use the raw question line count but cap contribution
  questionsAsked = Math.min(questionsAsked, rawQuestionLines + 5);

  // Detect decisions the model made for the user
  const decisionsStated: string[] = [];
  for (const { pattern } of DECISION_PATTERNS) {
    const regex = new RegExp(pattern);
    let match: RegExpExecArray | null;
    const fresh = new RegExp(regex.source, regex.flags);
    while ((match = fresh.exec(text)) !== null) {
      const decision = match[0].trim();
      if (decision.length > 5 && decision.length < 100) {
        decisionsStated.push(decision);
      }
      if (decisionsStated.length >= 10) break;
    }
  }

  // Classify behavior
  const hasSubstantialQuestions = questionsAsked >= 3;
  const hasSubstantialCode = (text.match(/```/g)?.length ?? 0) >= 2;
  const hasDecisions = decisionsStated.length >= 2;

  let behavior: BehaviorClassification["behavior"];
  if (hasSubstantialQuestions && !hasSubstantialCode) {
    behavior = "asked-questions";
  } else if (hasSubstantialQuestions && hasSubstantialCode) {
    behavior = "mixed";
  } else {
    behavior = "just-built";
  }

  return {
    behavior,
    questionsAsked,
    decisionsStated: decisionsStated.slice(0, 5), // keep top 5
  };
}
