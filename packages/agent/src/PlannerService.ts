import OpenAI from 'openai';
import { Plan } from 'types';

const openai = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // required but unused
});

const planSchema = `
export type StepStatus = "pending"|"dry-run"|"running"|"paused"|"done"|"error";
export interface Step {
  id: string; // A unique identifier for the step
  intent: string; // What is the purpose of this step?
  cmd?: string; // The shell command to execute
  tool?: string; // The name of a tool to use (e.g., 'npm')
  args?: unknown; // Arguments for the tool
  approvalRequired?: boolean; // Does this step require user approval?
  continueOnFail?: boolean; // Should the plan continue if this step fails?
  status: StepStatus; // The current status of the step, should be "pending"
}
export interface Plan {
  goal: string; // The original goal
  steps: Step[]; // The sequence of steps to achieve the goal
  createdAt: number; // The timestamp of when the plan was created
}
`;

export class PlannerService {
  async createPlan(goal: string): Promise<Plan> {
    const prompt = \`You are an expert software engineer and command-line user. Your task is to take a high-level goal and break it down into a detailed, step-by-step plan.
      The plan must be represented as a JSON object that strictly adheres to the following TypeScript interface:

      \`\`\`typescript
      \${planSchema}
      \`\`\`

      Analyze the user's goal: "\${goal}"

      Think step-by-step. What commands need to be run? In what order? Are there any dangerous operations that might need user approval?

      Respond with ONLY the JSON object for the plan. Do not include any other text, explanations, or markdown formatting.
    \`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'llama3',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: goal,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('LLM returned an empty response.');
      }

      const plan = JSON.parse(content) as Plan;
      // Add createdAt timestamp
      plan.createdAt = Date.now();
      return plan;

    } catch (error) {
      console.error('Error generating plan from LLM:', error);
      // Return a fallback plan on error
      return {
        goal,
        steps: [
          {
            id: 'error-step',
            intent: 'Failed to generate a plan.',
            status: 'error',
          },
        ],
        createdAt: Date.now(),
      };
    }
  }
}
