// Plan & Step
export type StepStatus = "pending"|"dry-run"|"running"|"paused"|"done"|"error";
export interface Step {
  id: string; intent: string;
  cmd?: string; tool?: string; args?: unknown;
  approvalRequired?: boolean; continueOnFail?: boolean;
  status: StepStatus; logs?: string[]; startedAt?: number; endedAt?: number;
}
export interface Plan { goal: string; steps: Step[]; createdAt: number; }

// Tool contract
export interface ToolSchema {
  name: string;
  permissions: string[]; // "process", "fs:read", "net:github.com"
  functions: Record<string, (args: unknown, ctx: ToolContext) => Promise<unknown>>;
}
export interface ToolContext {
  cwd: string; env: Record<string,string>;
  policy: Policy; logger: (l:string)=>void;
}

// Policy
export interface Policy {
  mode: "safe"|"trusted"|"headless";
  fsAllow: string[]; netAllow: string[]; commandDeny: string[];
  maxFilesTouched: number; timeoutMs: number;
}
