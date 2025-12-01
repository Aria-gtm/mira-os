import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, conversations, messages } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

// Mock context helper
function createMockContext(userId?: number) {
  const mockReq = {} as Request;
  const mockRes = {} as Response;
  
  return {
    req: mockReq,
    res: mockRes,
    user: userId ? {
      id: userId,
      openId: `test-user-${userId}`,
      name: `Test User ${userId}`,
      email: `test${userId}@example.com`,
      loginMethod: "email",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } : null,
  };
}

describe("Conversation Management", () => {
  let testUserId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test data
    await db.delete(messages).where(eq(messages.conversationId, 1));
    await db.delete(conversations).where(eq(conversations.userId, 999));
    await db.delete(users).where(eq(users.openId, "test-user-999"));

    // Create test user
    await db.insert(users).values({
      openId: "test-user-999",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "email",
    });

    const result = await db.select().from(users).where(eq(users.openId, "test-user-999"));
    testUserId = result[0].id;
  });

  it("should create a new conversation", async () => {
    const caller = appRouter.createCaller(createMockContext(testUserId));
    
    const result = await caller.conversations.create({});
    
    expect(result.conversationId).toBeDefined();
    expect(typeof result.conversationId).toBe("number");
  });

  it("should create a conversation with a title", async () => {
    const caller = appRouter.createCaller(createMockContext(testUserId));
    
    const result = await caller.conversations.create({ title: "My First Chat" });
    
    expect(result.conversationId).toBeDefined();
    
    const conversation = await caller.conversations.get({ conversationId: result.conversationId! });
    expect(conversation.conversation.title).toBe("My First Chat");
  });

  it("should list user conversations", async () => {
    const caller = appRouter.createCaller(createMockContext(testUserId));
    
    // Create two conversations
    await caller.conversations.create({ title: "Chat 1" });
    await caller.conversations.create({ title: "Chat 2" });
    
    const conversations = await caller.conversations.list();
    
    expect(conversations.length).toBeGreaterThanOrEqual(2);
    expect(conversations.some(c => c.title === "Chat 1")).toBe(true);
    expect(conversations.some(c => c.title === "Chat 2")).toBe(true);
  });

  it("should add messages to a conversation", async () => {
    const caller = appRouter.createCaller(createMockContext(testUserId));
    
    const conv = await caller.conversations.create({});
    const conversationId = conv.conversationId!;
    
    await caller.conversations.addMessage({
      conversationId,
      role: "user",
      content: "Hello Mira!",
    });
    
    await caller.conversations.addMessage({
      conversationId,
      role: "assistant",
      content: "Hello! How can I help you today?",
      audioUrl: "https://example.com/audio.mp3",
    });
    
    const conversation = await caller.conversations.get({ conversationId });
    
    expect(conversation.messages.length).toBe(2);
    expect(conversation.messages[0].role).toBe("user");
    expect(conversation.messages[0].content).toBe("Hello Mira!");
    expect(conversation.messages[1].role).toBe("assistant");
    expect(conversation.messages[1].audioUrl).toBe("https://example.com/audio.mp3");
  });

  it("should auto-generate title from first user message", async () => {
    const caller = appRouter.createCaller(createMockContext(testUserId));
    
    const conv = await caller.conversations.create({});
    const conversationId = conv.conversationId!;
    
    await caller.conversations.addMessage({
      conversationId,
      role: "user",
      content: "What's the weather like today?",
    });
    
    const conversation = await caller.conversations.get({ conversationId });
    
    expect(conversation.conversation.title).toBe("What's the weather like today?");
  });

  it("should update conversation title", async () => {
    const caller = appRouter.createCaller(createMockContext(testUserId));
    
    const conv = await caller.conversations.create({ title: "Old Title" });
    const conversationId = conv.conversationId!;
    
    await caller.conversations.updateTitle({
      conversationId,
      title: "New Title",
    });
    
    const conversation = await caller.conversations.get({ conversationId });
    
    expect(conversation.conversation.title).toBe("New Title");
  });

  it("should not allow access to other user's conversations", async () => {
    const caller1 = appRouter.createCaller(createMockContext(testUserId));
    
    const conv = await caller1.conversations.create({ title: "Private Chat" });
    const conversationId = conv.conversationId!;
    
    // Create another user
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db.insert(users).values({
      openId: "test-user-998",
      name: "Other User",
      email: "other@example.com",
      loginMethod: "email",
    });
    
    const otherUserResult = await db.select().from(users).where(eq(users.openId, "test-user-998"));
    const otherUserId = otherUserResult[0].id;
    
    const caller2 = appRouter.createCaller(createMockContext(otherUserId));
    
    // Try to access first user's conversation
    await expect(
      caller2.conversations.get({ conversationId })
    ).rejects.toThrow("Conversation not found or access denied");
    
    // Cleanup
    await db.delete(users).where(eq(users.openId, "test-user-998"));
  });

  it("should require authentication for conversation operations", async () => {
    const caller = appRouter.createCaller(createMockContext()); // No user
    
    await expect(caller.conversations.list()).rejects.toThrow();
    await expect(caller.conversations.create({})).rejects.toThrow();
  });
});
