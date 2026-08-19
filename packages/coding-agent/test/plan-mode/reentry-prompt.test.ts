import { describe, expect, it } from "bun:test";
import { prompt } from "@oh-my-pi/pi-utils";
import planModeActivePrompt from "../../src/prompts/system/plan-mode-active.md" with { type: "text" };

const BASE = {
	planFilePath: "local://old-feature-plan.md",
	writeToolName: "write",
	editToolName: "edit",
	isHashlineEditMode: false,
	iterative: false,
	taskAvailable: true,
	scoutAvailable: true,
	reentry: false,
	planExists: true,
} as const;

type Overrides = Partial<Record<keyof typeof BASE, boolean | string>>;

function render(overrides: Overrides = {}): string {
	return prompt.render(planModeActivePrompt, { ...BASE, ...overrides });
}

describe("plan-mode re-entry prompt", () => {
	it("only emits the Re-entry section when re-entering", () => {
		expect(render({ reentry: false })).not.toContain("## Re-entry");
		expect(render({ reentry: true })).toContain("## Re-entry");
	});
});

describe("plan-mode-active tool availability", () => {
	it("records preferences as assumptions when planning", () => {
		const iterative = render({ iterative: true });
		expect(iterative).toContain("Record as Assumptions with a recommended default");
		expect(iterative).toContain("record preferences/tradeoffs as Assumptions");
		expect(iterative).not.toContain("`ask`");

		const parallel = render({ iterative: false });
		expect(parallel).toContain("record remaining preference questions as Assumptions with a recommended default");
		expect(parallel).not.toContain("Presenting a choice between approaches");
	});

	it("omits scout-via-task dispatch when the task tool is unavailable", () => {
		const withoutTask = render({ taskAvailable: false, scoutAvailable: true });
		expect(withoutTask).not.toContain("(via `task`)");

		const withTask = render({ taskAvailable: true, scoutAvailable: true });
		expect(withTask).toContain("(via `task`)");
	});
});
