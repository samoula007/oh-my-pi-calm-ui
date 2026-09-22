import { describe, expect, test } from "bun:test";
import { buildParams } from "@oh-my-pi/pi-ai/providers/openai-responses";
import type { Context } from "@oh-my-pi/pi-ai/types";
import { Effort } from "@oh-my-pi/pi-catalog/effort";
import { getBundledModel } from "@oh-my-pi/pi-catalog/models";

const GPT_6_MODEL_IDS = ["gpt-6-luna", "gpt-6-sol"];
const GPT_6_EFFORTS = [Effort.Low, Effort.Medium, Effort.High, Effort.XHigh, Effort.Max];
const CONTEXT: Context = {
	messages: [{ role: "user", content: "hello", timestamp: 0 }],
};

describe("OpenAI GPT-6 Responses reasoning payload", () => {
	for (const id of GPT_6_MODEL_IDS) {
		test(`${id} serializes none and every supported thinking level`, () => {
			const model = getBundledModel<"openai-responses">("openai", id);
			if (!model) throw new Error(`openai/${id} must be in bundled models.json`);

			const disabled = buildParams(model, CONTEXT, { disableReasoning: true }, undefined);
			expect(disabled.params.reasoning).toEqual({ effort: "none" });

			for (const effort of GPT_6_EFFORTS) {
				const enabled = buildParams(model, CONTEXT, { reasoning: effort }, undefined);
				expect(enabled.params.reasoning).toEqual({ effort, summary: "auto" });
			}
		});
	}
});
