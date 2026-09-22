import type { TokenCost } from "./types";

/** Standard GPT-5.6 Sol rates used by the Daybreak Blue aliases. */
export const OPENAI_GPT_56_SOL_STANDARD_COST = {
	input: 5,
	output: 30,
	cacheRead: 0.5,
	cacheWrite: 6.25,
} as const satisfies TokenCost;

/** Standard GPT-5.6 Cyber rates used by the Daybreak Red aliases. */
export const OPENAI_GPT_56_CYBER_STANDARD_COST = {
	input: 12.5,
	output: 75,
	cacheRead: 1.25,
	cacheWrite: 15.625,
} as const satisfies TokenCost;
/** Standard GPT-6 Luna rates for direct OpenAI and Codex catalog entries. */
export const OPENAI_GPT_6_LUNA_STANDARD_COST = {
	input: 0.1,
	output: 0.5,
	cacheRead: 0.01,
	cacheWrite: 0.125,
} as const satisfies TokenCost;

/** Standard GPT-6 Sol rates for direct OpenAI and Codex catalog entries. */
export const OPENAI_GPT_6_SOL_STANDARD_COST = {
	input: 2,
	output: 10,
	cacheRead: 0.2,
	cacheWrite: 2.5,
} as const satisfies TokenCost;

/** GPT-6 rates for prompts exceeding the 272K long-context threshold. */
export const OPENAI_GPT_6_LONG_CONTEXT_COSTS = {
	luna: {
		inputThreshold: 272_000,
		input: 0.2,
		output: 0.75,
		cacheRead: 0.02,
		cacheWrite: 0.25,
	},
	sol: {
		inputThreshold: 272_000,
		input: 4,
		output: 15,
		cacheRead: 0.4,
		cacheWrite: 5,
	},
} as const satisfies Readonly<Record<"luna" | "sol", TokenCost & { inputThreshold: number }>>;

/** Resolve GPT-6 standard rates for Codex discovery rows. */
export function resolveOpenAIGpt6StandardCost(modelId: string): TokenCost | undefined {
	switch (modelId) {
		case "gpt-6-luna":
			return OPENAI_GPT_6_LUNA_STANDARD_COST;
		case "gpt-6-sol":
			return OPENAI_GPT_6_SOL_STANDARD_COST;
		default:
			return undefined;
	}
}

/** Resolve standard rates for Codex-prefixed Daybreak aliases. */
export function resolveOpenAIDaybreakStandardCost(modelId: string): TokenCost | undefined {
	switch (modelId) {
		case "gpt-daybreak-blue-latest":
			return OPENAI_GPT_56_SOL_STANDARD_COST;
		case "gpt-daybreak-red-latest":
			return OPENAI_GPT_56_CYBER_STANDARD_COST;
		default:
			return undefined;
	}
}
