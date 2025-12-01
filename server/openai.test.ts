import { describe, expect, it } from "vitest";

describe("OpenAI API Key Validation", () => {
  it("should have valid OPENAI_API_KEY configured", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    
    // Test with a simple API call to validate the key
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  }, 10000);
});
