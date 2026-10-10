import type { QuestionInput } from "./questions.ts";

const question = (q: Pick<QuestionInput, "kind" | "prompt"> & Partial<QuestionInput>): QuestionInput => ({
  description: null,
  options: [],
  scaleMax: null,
  multiline: true,
  required: false,
  ...q,
});

export const demo = {
  title: "A few quick questions",
  questions: [
    question({
      kind: "single",
      prompt: "Are you scared about AI?",
      options: ["yep", "nah", "its a fucking computer bro stfu", "sillycon mafia"],
      required: true,
    }),
    question({
      kind: "single",
      prompt: "bruh..",
      options: ["what bro?! relax.. smh..", "chill dude."],
      required: true,
    }),
    question({
      kind: "text",
      prompt: "write a 1200 page essay on mannerisms and honeybees",
      description: "zip it! 🤐",
    }),
    question({
      kind: "multi",
      prompt: "how do you feel about cheeseburgers disappearing from existence?",
      options: ["fucking terrified mate", "a little bothered but i’ll survive", "couldnt care less mate"],
      required: true,
    }),
  ],
};
