type AIRequest = {
  code?: string;
  message?: string;
  type?: "chat" | "suggest" | "explain";
};

const CODE_FENCE = "```";

function summarizeCode(code: string) {
  const lines = code.split("\n").filter((line) => line.trim());
  const imports = lines.filter((line) => line.trim().startsWith("import")).length;
  const exports = lines.filter((line) => line.includes("export ")).length;
  const functions = lines.filter((line) => /\b(function|const|let|class)\b/.test(line)).length;

  return `${lines.length} non-empty lines, ${imports} imports, ${exports} exports, ${functions} likely moving parts`;
}

export function buildFallbackAIReply({ code = "", message = "", type = "chat" }: AIRequest) {
  const summary = summarizeCode(code);

  if (type === "explain") {
    return `Here is the quick read: this code currently has ${summary}. Start by naming the user-facing behavior in one sentence, then trace the main data path from input to output. The fastest next move is to add one tiny example call or test that proves the intended behavior.`;
  }

  if (type === "suggest") {
    return `Three useful next moves: add one happy-path test, add one guard for bad input, and split any UI or API branch that is doing more than one job. Current snapshot: ${summary}.`;
  }

  const prompt = message.trim() || "Give us direction";
  return `I would frame it like this: "${prompt}". Pick the smallest demoable slice, keep the shared code under one clear owner, and write down the contract before expanding. Current code snapshot: ${summary}.`;
}

export async function generateAIReply({ code = "", message = "", type = "chat" }: AIRequest) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return {
      response: buildFallbackAIReply({ code, message, type }),
      provider: "local",
    };
  }

  const systemPrompt =
    "You are DevMegle's in-room pair engineer. Be concise, practical, security-aware, and tuned for two strangers trying to ship a tiny working prototype together.";

  const task =
    type === "suggest"
      ? "Review the code and suggest the next three highest leverage changes."
      : type === "explain"
        ? "Explain what the code is doing and where the pair should look first."
        : message || "Help the pair decide the next move.";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama3-8b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${task}\n\nCurrent code:\n${CODE_FENCE}\n${code.slice(0, 20_000)}\n${CODE_FENCE}`,
        },
      ],
      max_tokens: 700,
      temperature: 0.45,
      stream: false,
    }),
  });

  if (!response.ok) {
    return {
      response: buildFallbackAIReply({ code, message, type }),
      provider: "local",
    };
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return {
    response: data.choices?.[0]?.message?.content || buildFallbackAIReply({ code, message, type }),
    provider: "groq",
  };
}
