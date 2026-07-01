import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

function safeJsonParse(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const businessIdea = body.businessIdea?.trim();
    const industry = body.industry?.trim();
    const audience = body.audience?.trim();

    if (!businessIdea) {
      return NextResponse.json(
        { error: "Business idea is required." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.85,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You are CreatorOS AI, an expert AI business architect for creators, agencies, coaches, artists, influencers, consultants, and digital product sellers. Return only valid JSON. Do not use markdown.",
        },
        {
          role: "user",
          content: `
Create a complete AI-powered creator business package.

Business idea:
${businessIdea}

Industry:
${industry || "Not provided"}

Target audience:
${audience || "Not provided"}

Return valid JSON using this exact structure:

{
  "businessName": "",
  "tagline": "",
  "industry": "",
  "audience": "",
  "description": "",
  "brandVoice": "",
  "mission": "",
  "vision": "",
  "brandColors": {
    "primary": "",
    "secondary": "",
    "accent": "",
    "background": "",
    "text": ""
  },
  "logoPrompt": "",
  "storefrontHeadline": "",
  "storefrontSubheadline": "",
  "aboutSection": "",
  "servicesSection": "",
  "pricingSection": "",
  "contactSection": "",
  "products": [
    {
      "name": "",
      "price": "",
      "description": "",
      "type": "service"
    }
  ],
  "faq": [
    {
      "question": "",
      "answer": ""
    }
  ],
  "refundPolicy": "",
  "termsSummary": "",
  "aiEmployee": {
    "name": "",
    "role": "AI Sales Manager",
    "openingMessage": "",
    "instructions": ""
  },
  "marketingPlan": {
    "positioning": "",
    "offerAngle": "",
    "contentPillars": [],
    "launchStrategy": "",
    "growthIdeas": []
  },
  "emailSequence": [
    {
      "subject": "",
      "body": ""
    }
  ],
  "socialPosts": [
    {
      "platform": "",
      "caption": "",
      "hashtags": []
    }
  ],
  "salesFunnel": {
    "leadMagnet": "",
    "frontEndOffer": "",
    "upsell": "",
    "followUp": ""
  },
  "seo": {
    "title": "",
    "description": "",
    "keywords": []
  },
  "checklist": []
}

Rules:
- Create 5 products minimum.
- Make prices realistic.
- Make the brand feel premium and modern.
- Make the AI employee useful for sales and support.
- Make the content specific to the business idea.
- Do not include markdown.
- Do not include explanations outside the JSON.
          `,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: "OpenAI returned no response." },
        { status: 500 }
      );
    }

    const generatedBusiness = safeJsonParse(text);

    return NextResponse.json({
      success: true,
      input: {
        businessIdea,
        industry,
        audience,
      },
      generatedBusiness,
    });
  } catch (error) {
    console.error("Business builder error:", error);

    return NextResponse.json(
      { error: "Unable to generate business." },
      { status: 500 }
    );
  }
}