import Anthropic from "@anthropic-ai/sdk";
import {
  AgreementDataSchema,
  CONFIDENCE_THRESHOLD,
  type ExtractionResult,
} from "./schema";
import {
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_FEW_SHOT_EXAMPLES,
} from "./prompt";
import { db } from "../db/client";

const anthropic = new Anthropic();

export async function extractAgreement(
  rawInput: string
): Promise<{ id: string; extraction: ExtractionResult; state: string }> {
  const extraction = await callClaude(rawInput);
  const accepted = extraction.confidence >= CONFIDENCE_THRESHOLD && extraction.data !== null;
  const state = accepted ? "DRAFT" : "REJECTED";

  const result = await db.query(
    `INSERT INTO agreements (id, raw_input, extracted_data, confidence_score, state, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())
     RETURNING id, state`,
    [rawInput, JSON.stringify(extraction.data), extraction.confidence, state]
  );

  return {
    id: result.rows[0].id,
    extraction,
    state: result.rows[0].state,
  };
}

async function callClaude(rawInput: string): Promise<ExtractionResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      ...EXTRACTION_FEW_SHOT_EXAMPLES,
      {
        role: "user",
        content: `Extract the agreement from this conversation:\n\n${rawInput}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      data: null,
      confidence: 0,
      missing_fields: [],
      warnings: ["Failed to parse Claude response as JSON"],
    };
  }

  const raw = parsed as Record<string, unknown>;
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0;
  const missing_fields = Array.isArray(raw.missing_fields)
    ? (raw.missing_fields as string[])
    : [];
  const warnings = Array.isArray(raw.warnings)
    ? (raw.warnings as string[])
    : [];

  const validation = AgreementDataSchema.safeParse(raw.data);
  if (!validation.success) {
    return {
      data: null,
      confidence: Math.min(confidence, 0.4),
      missing_fields: [
        ...missing_fields,
        ...validation.error.issues.map((i) => i.path.join(".")),
      ],
      warnings: [
        ...warnings,
        ...validation.error.issues.map((i) => i.message),
      ],
    };
  }

  return { data: validation.data, confidence, missing_fields, warnings };
}
