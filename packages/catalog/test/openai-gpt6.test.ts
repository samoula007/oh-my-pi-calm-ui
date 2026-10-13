import { describe, expect, test } from "bun:test";
import { buildModel } from "@oh-my-pi/pi-catalog/build";
import { Effort } from "@oh-my-pi/pi-catalog/effort";
import { getBundledModel } from "@oh-my-pi/pi-catalog/models";
import { getSupportedEfforts } from "@oh-my-pi/pi-catalog/model-thinking";
import { OPENAI_GPT_6_CURATED_FALLBACK_MODELS } from "@oh-my-pi/pi-catalog/provider-models/openai-compat";
import type { ModelSpec } from "@oh-my-pi/pi-catalog/types";
import { applyGeneratedModelPolicies } from "../scripts/generated-policies";

const GPT_6_EFFORTS = [Effort.Low, Effort.Medium, Effort.High, Effort.XHigh, Effort.Max];

describe("OpenAI GPT-6 and GPT-6.1 models", () => {
	test("curates direct OpenAI and ChatGPT Codex routes with documented metadata", () => {
		const byKey = Object.fromEntries(
			OPENAI_GPT_6_CURATED_FALLBACK_MODELS.map(model => [`${model.provider}/${model.id}`, model]),
		);

		expect(Object.keys(byKey)).toEqual([
			"openai/gpt-6-luna",
			"openai/gpt-6-sol",
			"openai/gpt-6.1-sol",
			"openai-codex/gpt-6-luna",
			"openai-codex/gpt-6-sol",
			"openai-codex/gpt-6.1-sol",
		]);
		expect(byKey["openai/gpt-6-luna"]).toMatchObject({
			api: "openai-responses",
			cost: { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
			contextWindow: 1_050_000,
			maxTokens: 128_000,
		});
		expect(byKey["openai/gpt-6-sol"]).toMatchObject({
			api: "openai-responses",
			cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
			contextWindow: 1_050_000,
			maxTokens: 128_000,
		});
		expect(byKey["openai/gpt-6.1-sol"]).toMatchObject({
			api: "openai-responses",
			cost: { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
			contextWindow: 1_050_000,
			maxTokens: 128_000,
		});
		for (const id of ["gpt-6-luna", "gpt-6-sol", "gpt-6.1-sol"]) {
			expect(byKey[`openai-codex/${id}`]).toMatchObject({
				api: "openai-codex-responses",
				remoteCompaction: { enabled: true, v2StreamingEnabled: true },
				contextWindow: 1_000_000,
				maxTokens: 128_000,
			});
		}
	});

	test("bundles GPT-6.1 Sol for both OpenAI and Codex", () => {
		const direct = getBundledModel("openai", "gpt-6.1-sol");
		const codex = getBundledModel("openai-codex", "gpt-6.1-sol");
		expect(direct).toMatchObject({
			api: "openai-responses",
			contextWindow: 1_050_000,
			cost: { cacheRead: 0.1, longContext: { cacheRead: 0.2 } },
		});
		expect(codex).toMatchObject({
			api: "openai-codex-responses",
			contextWindow: 1_000_000,
			cost: { cacheRead: 0.1 },
			preferWebsockets: true,
		});
	});

	test("applies direct OpenAI reasoning, long-context, computer-use, and patch policies", () => {
		const specs = OPENAI_GPT_6_CURATED_FALLBACK_MODELS.filter(
			(model): model is ModelSpec<"openai-responses"> => model.provider === "openai",
		).map(model => ({ ...model, cost: { ...model.cost } }));

		applyGeneratedModelPolicies(specs);

		for (const spec of specs) {
			const model = buildModel(spec);
			expect(getSupportedEfforts(model)).toEqual(GPT_6_EFFORTS);
			if (spec.id !== "gpt-6.1-sol") {
				expect(model.compat.reasoningDisableMode).toBe("none-effort");
			}
			expect(model.cost.longContext).toBeDefined();
			expect(model.applyPatchToolType).toBe("freeform");
			expect(model.supportsComputerUse).toBe(true);
		}
	});

	test("prices GPT-6.1 Sol long-context requests at documented rates", () => {
		const spec = OPENAI_GPT_6_CURATED_FALLBACK_MODELS.find(
			model => model.provider === "openai" && model.id === "gpt-6.1-sol",
		);
		expect(spec).toBeDefined();
		const priced = { ...spec!, cost: { ...spec!.cost } };
		applyGeneratedModelPolicies([priced]);
		expect(priced.cost.longContext).toEqual({
			inputThreshold: 272_000,
			input: 4,
			output: 15,
			cacheRead: 0.2,
			cacheWrite: 5,
		});
	});

	test("pins discovered Codex GPT-6 and GPT-6.1 routes to the 1M context floor", () => {
		const specs = OPENAI_GPT_6_CURATED_FALLBACK_MODELS.filter(
			(model): model is ModelSpec<"openai-codex-responses"> => model.provider === "openai-codex",
		).map(model => ({ ...model, cost: { ...model.cost } }));

		applyGeneratedModelPolicies(specs);

		for (const model of specs) {
			expect(model.contextWindow).toBe(1_000_000);
			expect(model.applyPatchToolType).toBe("freeform");
		}
	});
});
