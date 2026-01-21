import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/**
 * 文字列を SHA-256 でハッシュ化して16進数文字列を返す
 */
async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json(
      {
        error: "You must be signed in to use the agent.",
      },
      { status: 401 }
    );
  }

  try {
    const { message, sessionId } = (await request.json()) as {
      message?: string;
      sessionId?: string;
    };

    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required.",
        },
        { status: 400 }
      );
    }

    // actorId はクライアント入力を信用せず、NextAuth セッションから導出する
    // Bedrock AgentCore Memory の actorId は [a-zA-Z0-9][a-zA-Z0-9-_/]* パターンなので
    // メールアドレスを SHA-256 ハッシュ化して使用
    const rawActorId =
      session.user?.email?.trim() ||
      session.user?.name?.trim() ||
      "unknown";
    const actorId = await sha256(rawActorId);

    // sessionId はクライアントが持っていればそれを使い、なければサーバーで生成
    const resolvedSessionId =
      typeof sessionId === "string" && sessionId.trim()
        ? sessionId.trim()
        : crypto.randomUUID();

    // Agent Core APIエンドポイント
    const agentCoreUrl = process.env.AGENT_CORE_API_URL;
    if (!agentCoreUrl) {
      return NextResponse.json(
        {
          error: "Agent Core API URL is not configured.",
        },
        { status: 500 }
      );
    }

    // Agent Coreにリクエストを送信
    // agentCoreUrl は既に /invocations を含んでいる形式
    const response = await fetch(agentCoreUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        prompt: message,
        actorId,
        sessionId: resolvedSessionId,
      }),
    });
    
    console.log("response", response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Agent Core API error:", errorText);
      return NextResponse.json(
        {
          error: `Agent Core API error: ${response.status}`,
          details: errorText,
          actorId,
          sessionId: resolvedSessionId,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Agent Core 側が echo しない互換ケースに備えて、最低限こちらでも付与する
    return NextResponse.json({
      ...data,
      actorId: (data as { actorId?: unknown }).actorId ?? actorId,
      sessionId: (data as { sessionId?: unknown }).sessionId ?? resolvedSessionId,
    });
  } catch (error) {
    console.error("Error invoking agent:", error);
    return NextResponse.json(
      {
        error: "Failed to invoke agent.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

