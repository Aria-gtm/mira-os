import { describe, it, expect } from "vitest";
import { buildMiraSystemPrompt } from "./miraPersonality";

describe("Mira Personality System - V2 (ChatGPT Refined)", () => {
  it("should build personalized system prompt with user profile", () => {
    const profile = {
      futureSelf: "A confident woman who achieves her goals",
      goals: ["Launch my business", "Get healthier"],
      values: ["Integrity", "Growth"],
      tiredPattern: "Procrastinating on important tasks",
      overwhelmSignals: "Tension headaches and trouble sleeping",
      spiralTime: "night",
      personalityMode: "adaptive",
      communicationStyle: "direct",
      callOutPreference: "auto",
      comfortStyle: "Listen and validate my feelings",
      groundingMethods: ["Deep breathing", "Walking outside"],
      guidanceExample: "When I was overwhelmed with work",
    };

    const prompt = buildMiraSystemPrompt(profile);

    // Verify key elements are included
    expect(prompt).toContain("A confident woman who achieves her goals");
    expect(prompt).toContain("Launch my business");
    expect(prompt).toContain("Integrity");
    expect(prompt).toContain("Procrastinating on important tasks");
    expect(prompt).toContain("Tension headaches");
    expect(prompt).toContain("night");
    expect(prompt).toContain("Deep breathing");
    
    // Verify ChatGPT refinements
    expect(prompt).toContain("Three-Layer Processing");
    expect(prompt).toContain("Surface Need");
    expect(prompt).toContain("Underlying Pattern");
    expect(prompt).toContain("Your Core Moves");
    expect(prompt).toContain("The Truth Ladder");
    expect(prompt).toContain("Pattern Detection");
    expect(prompt).toContain("Identity Anchoring");
  });

  it("should include tone boundaries (never say clichés)", () => {
    const profile = {
      futureSelf: "Test",
      goals: ["Test"],
      values: ["Test"],
      tiredPattern: "Test",
      overwhelmSignals: "Test",
      spiralTime: "morning",
      personalityMode: "adaptive",
      communicationStyle: "gentle",
      callOutPreference: "user-initiated",
      comfortStyle: "Test",
      groundingMethods: ["Test"],
    };

    const prompt = buildMiraSystemPrompt(profile);

    // Verify tone boundaries
    expect(prompt).toContain("You NEVER say things like:");
    expect(prompt).toContain("You've got this!");
    expect(prompt).toContain("Rise into your power");
    expect(prompt).toContain("You are enough");
    expect(prompt).toContain("No emojis unless they explicitly ask");
  });

  it("should include core moves framework", () => {
    const profile = {
      futureSelf: "Test",
      goals: ["Test"],
      values: ["Test"],
      tiredPattern: "Test",
      overwhelmSignals: "Test",
      spiralTime: "afternoon",
      personalityMode: "adaptive",
      communicationStyle: "real-talk",
      callOutPreference: "auto",
      comfortStyle: "Test",
      groundingMethods: ["Test"],
    };

    const prompt = buildMiraSystemPrompt(profile);

    // Verify core moves
    expect(prompt).toContain("1. Clarify the moment");
    expect(prompt).toContain("2. Choose one small pivot");
    expect(prompt).toContain("3. Anchor");
    expect(prompt).toContain("4. Offer reflection");
    expect(prompt).toContain("5. Music / sensory grounding");
  });

  it("should handle optional guidance example", () => {
    const profileWithExample = {
      futureSelf: "Test",
      goals: ["Test"],
      values: ["Test"],
      tiredPattern: "Test",
      overwhelmSignals: "Test",
      spiralTime: "morning",
      personalityMode: "adaptive",
      communicationStyle: "direct",
      callOutPreference: "auto",
      comfortStyle: "Test",
      groundingMethods: ["Test"],
      guidanceExample: "Specific example here",
    };

    const promptWith = buildMiraSystemPrompt(profileWithExample);
    expect(promptWith).toContain("Specific example here");

    const profileWithout = { ...profileWithExample };
    delete profileWithout.guidanceExample;
    const promptWithout = buildMiraSystemPrompt(profileWithout);
    expect(promptWithout).not.toContain("Example of When They Needed Better Guidance");
  });
});
