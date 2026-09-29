const HINDSIGHT_BASE_URL =
  process.env.HINDSIGHT_BASE_URL || "http://localhost:8888";

const HINDSIGHT_API_KEY =
  process.env.HINDSIGHT_API_KEY || "dev-key";

const HINDSIGHT_BANK_ID =
  process.env.HINDSIGHT_DEFAULT_BANK || "fixmemory-main";

async function hindsightRequest(endpoint, options = {}) {
  const response = await fetch(`${HINDSIGHT_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HINDSIGHT_API_KEY}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `Hindsight API error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

// Check Hindsight health
async function healthCheck() {
  return hindsightRequest("/health");
}

// Recall relevant memories
async function recallMemories(query, options = {}) {
  const {
    bankId = HINDSIGHT_BANK_ID,
    maxTokens = 2000,
  } = options;

  return hindsightRequest(
    `/v1/default/banks/${bankId}/memories/recall`,
    {
      method: "POST",
      body: JSON.stringify({
        query,
        max_tokens: maxTokens,
      }),
    }
  );
}

// Store a new memory
async function retainMemory(content, options = {}) {
  const {
    bankId = HINDSIGHT_BANK_ID,
  } = options;

  return hindsightRequest(
    `/v1/default/banks/${bankId}/memories`,
    {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            content,
          },
        ],
      }),
    }
  );
}

export {
  healthCheck,
  recallMemories,
  retainMemory,
};