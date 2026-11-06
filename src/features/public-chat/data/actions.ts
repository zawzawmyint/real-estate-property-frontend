"use server";

import { headers } from "next/headers";
import { getBackendOrigin } from "@/lib/api/server";
import { inquiryRelayHeaders } from "@/features/leads/data/inquiry-relay";
import { chatMessage, chatReply, type PublicChatReply } from "./schema";

type ChatResult =
  { ok: true; reply: PublicChatReply } | { ok: false; message: string };

const unavailable = {
  ok: false,
  message:
    "The property assistant is temporarily unavailable. Try again shortly.",
} as const;

export async function sendPublicChat(message: string): Promise<ChatResult> {
  if (process.env.PUBLIC_CHAT_ENABLED !== "true") return unavailable;

  const question = chatMessage.safeParse(message);
  if (!question.success)
    return { ok: false, message: "Enter a question of up to 500 characters." };

  try {
    const incoming = await headers();
    const origin = incoming.get("origin");
    if (
      !origin ||
      !/^https?:\/\//.test(origin) ||
      new URL(origin).origin !== origin
    )
      return unavailable;

    const response = await fetch(`${getBackendOrigin()}/api/v1/public/chat`, {
      method: "POST",
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(35_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Origin: origin,
        ...inquiryRelayHeaders(incoming),
      },
      body: JSON.stringify({ message: question.data }),
    });

    if (response.status === 429)
      return {
        ok: false,
        message: "The property assistant is busy. Try again in a moment.",
      };
    if (!response.ok) return unavailable;

    const reply = chatReply.safeParse(await response.json());
    return reply.success ? { ok: true, reply: reply.data } : unavailable;
  } catch {
    return unavailable;
  }
}
