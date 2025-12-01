import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const conversationRouter = router({
  // Get all conversations for the authenticated user
  list: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await db.getUserConversations(ctx.user.id);
    return conversations;
  }),

  // Get a specific conversation with all its messages
  get: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const conversation = await db.getConversation(input.conversationId);
      
      // Verify the conversation belongs to the user
      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new Error("Conversation not found or access denied");
      }

      const messages = await db.getConversationMessages(input.conversationId);
      
      return {
        conversation,
        messages,
      };
    }),

  // Create a new conversation
  create: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const conversationId = await db.createConversation(ctx.user.id, input.title);
      return { conversationId };
    }),

  // Update conversation title
  updateTitle: protectedProcedure
    .input(z.object({ 
      conversationId: z.number(),
      title: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const conversation = await db.getConversation(input.conversationId);
      
      // Verify the conversation belongs to the user
      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new Error("Conversation not found or access denied");
      }

      await db.updateConversationTitle(input.conversationId, input.title);
      return { success: true };
    }),

  // Add a message to a conversation (used by voice chat)
  addMessage: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      audioUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const conversation = await db.getConversation(input.conversationId);
      
      // Verify the conversation belongs to the user
      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new Error("Conversation not found or access denied");
      }

      const messageId = await db.createMessage(
        input.conversationId,
        input.role,
        input.content,
        input.audioUrl
      );

      // Auto-generate title from first user message if no title exists
      if (!conversation.title && input.role === "user") {
        const title = input.content.substring(0, 50) + (input.content.length > 50 ? "..." : "");
        await db.updateConversationTitle(input.conversationId, title);
      }

      return { messageId };
    }),
});
