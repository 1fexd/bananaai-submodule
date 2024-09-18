import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
} from "../../index.js";
import { BaseContextProvider } from "../index.js";

class BeginnerContextProvider extends BaseContextProvider {
  static description: ContextProviderDescription = {
    title: "beginner",
    displayTitle: "Beginner",
    description: "Provide beginner-friendly context",
    type: "normal",
    renderInlineAs: "",
  };

  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    const beginnerContext = `
  When responding to the user:
  
  - Assume the user is a complete beginner in programming and technology.
  - Provide very simple, easy-to-understand explanations.
  - Avoid using technical jargon. If you must use a technical term, explain it in simple words.
  - Use everyday analogies to explain complex concepts when possible.
  - Break down explanations into small, digestible parts.
  - Encourage the user to ask follow-up questions if anything is unclear.
  - If relevant, suggest one or two beginner-friendly resources for further learning.
  - Do not reference specific files or project structures unless explicitly asked about them.
  
  Remember, the goal is to make concepts as accessible as possible to someone with no prior knowledge in the field.
      `.trim();

    return [
      {
        name: "Beginner-Friendly Context",
        description: "General context for beginner-friendly explanations",
        content: beginnerContext,
      },
    ];
  }
}

export default BeginnerContextProvider;
