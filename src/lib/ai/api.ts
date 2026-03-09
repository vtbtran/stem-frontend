const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_COMPILER_URL ||
  "http://localhost:3001";

async function handleJsonResponse(res: Response) {
  if (!res.ok) {
    // Try to get error message from response
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      errorMsg = data?.error || errorMsg;
    } catch {
      // If response is not JSON, use status text
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  
  const data = await res.json().catch(() => null);
  if (!data?.success) {
    const message = data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function aiGenerateBlocks(prompt: string) {
  const res = await fetch(`${BASE_URL}/ai/blockly-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return handleJsonResponse(res) as Promise<{ success: boolean; blocklyJson: unknown }>;
}

export async function aiGenerateBlocksWithAllowlist(prompt: string, allowedBlockTypes: string[]) {
  try {
    const res = await fetch(`${BASE_URL}/ai/blockly-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, allowedBlockTypes }),
    });
    return handleJsonResponse(res) as Promise<{ success: boolean; blocklyJson: unknown }>;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(`Không thể kết nối đến backend (${BASE_URL}). Hãy đảm bảo backend đang chạy ở port 3001.`);
    }
    throw err;
  }
}

export async function aiExplainWorkspace(workspace: unknown) {
  try {
    const res = await fetch(`${BASE_URL}/ai/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace }),
    });
    return handleJsonResponse(res) as Promise<{ success: boolean; text: string }>;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(`Không thể kết nối đến backend (${BASE_URL}). Hãy đảm bảo backend đang chạy ở port 3001.`);
    }
    throw err;
  }
}

export async function aiFixWorkspace(workspace: unknown, allowedBlockTypes: string[], prompt?: string) {
  try {
    const res = await fetch(`${BASE_URL}/ai/blockly-fix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace, allowedBlockTypes, prompt }),
    });
    return handleJsonResponse(res) as Promise<{ success: boolean; blocklyJson: unknown }>;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(`Không thể kết nối đến backend (${BASE_URL}). Hãy đảm bảo backend đang chạy ở port 3001.`);
    }
    throw err;
  }
}

export async function aiExplainAndFixWorkspace(workspace: unknown, allowedBlockTypes: string[], prompt?: string) {
  try {
    const res = await fetch(`${BASE_URL}/ai/blockly-explain-fix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace, allowedBlockTypes, prompt }),
    });
    return handleJsonResponse(res) as Promise<{ success: boolean; explanation: string; blocklyJson: unknown }>;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(`Không thể kết nối đến backend (${BASE_URL}). Hãy đảm bảo backend đang chạy ở port 3001.`);
    }
    throw err;
  }
}

export async function aiGetChallenge() {
  try {
    const res = await fetch(`${BASE_URL}/ai/challenge`, {
      method: "GET",
    });
    return handleJsonResponse(res) as Promise<{ success: boolean; text: string }>;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(`Không thể kết nối đến backend (${BASE_URL}). Hãy đảm bảo backend đang chạy ở port 3001.`);
    }
    throw err;
  }
}

