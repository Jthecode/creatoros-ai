export type KnowledgeChunk = {
  id: string;
  businessId: string;
  title: string;
  content: string;
};

export function chunkText(text: string, maxLength = 900): string[] {
  if (!text.trim()) return [];

  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const nextChunk = `${currentChunk} ${sentence}`.trim();

    if (nextChunk.length > maxLength && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk = nextChunk;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export function buildBusinessKnowledge(input: {
  businessName: string;
  description?: string | null;
  industry?: string | null;
  audience?: string | null;
  brandVoice?: string | null;
  products?: {
    name: string;
    description?: string | null;
    price?: string | number | null;
  }[];
  faq?: {
    question: string;
    answer: string;
  }[];
}) {
  const productsText =
    input.products
      ?.map(
        (product) =>
          `Product: ${product.name}. Price: ${product.price ?? "Not listed"}. Description: ${
            product.description ?? "No description provided"
          }.`
      )
      .join("\n") ?? "";

  const faqText =
    input.faq
      ?.map((item) => `Question: ${item.question}\nAnswer: ${item.answer}`)
      .join("\n") ?? "";

  return `
Business Name: ${input.businessName}
Industry: ${input.industry ?? "Not provided"}
Audience: ${input.audience ?? "Not provided"}
Brand Voice: ${input.brandVoice ?? "Professional, helpful, and sales-focused"}

Business Description:
${input.description ?? "No description provided."}

Products:
${productsText || "No products listed yet."}

FAQ:
${faqText || "No FAQ listed yet."}
  `.trim();
}

export function searchKnowledge(
  query: string,
  chunks: KnowledgeChunk[],
  limit = 5
) {
  const normalizedQuery = query.toLowerCase();

  return chunks
    .map((chunk) => {
      const normalizedContent = `${chunk.title} ${chunk.content}`.toLowerCase();

      const score = normalizedQuery
        .split(/\s+/)
        .filter((word) => word.length > 2)
        .reduce((total, word) => {
          return normalizedContent.includes(word) ? total + 1 : total;
        }, 0);

      return {
        ...chunk,
        score,
      };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}