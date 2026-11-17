export const EXAMPLES = {
  typical: 'Decline Thursday and propose Friday after 3 PM',
  alternate: 'Politely decline Thursday at 2 PM and suggest Friday after 3 PM instead',
  challenge: 'Make it nicer but not too formal and explain that I have a class',
};

// Wizard-of-Oz: authored text, never a live model.
export const PREPARED_REPLIES = {
  typical: [
    "Hi Alex,\n\nThanks for checking. Thursday at 2 PM doesn't work for me. Would Friday after 3 PM work instead?\n\nThanks,\nSam",
    "Hi Alex,\n\nI can't make Thursday at 2 PM, but I'm available Friday after 3 PM. Would that work for you?\n\nBest,\nSam",
  ],
  challenge: [
    "Hi Alex,\n\nThanks for reaching out! I'd love to catch up, but I have a class on Thursday at 2 PM. Could we meet Friday after 3 PM instead? Hope that works for you!\n\nThanks,\nSam",
    "Hi Alex,\n\nIt would be great to go over the timeline together! I have a class Thursday at 2 PM, so I can't make that time. How about Friday after 3 PM? Let me know what works for you.\n\nThanks,\nSam",
  ],
};

function normalizeExample(instruction: string) {
  return instruction.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
}

// Deliberately fail closed: no keyword guesses about intent, negation, or dates.
// A supported phrase with added custom requests is also unsupported.
export function selectScenario(instruction: string): keyof typeof PREPARED_REPLIES | null {
  const normalized = normalizeExample(instruction);
  if ([EXAMPLES.typical, EXAMPLES.alternate].some((example) => normalizeExample(example) === normalized)) {
    return 'typical';
  }
  return normalizeExample(EXAMPLES.challenge) === normalized ? 'challenge' : null;
}
