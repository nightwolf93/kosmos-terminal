import { ToolSchema } from 'types';

export class ToolRegistry {
  private tools: Map<string, ToolSchema> = new Map();

  register(tool: ToolSchema): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" is already registered. Overwriting.`);
    }
    this.tools.set(tool.name, tool);
  }

  get(toolName: string): ToolSchema | undefined {
    return this.tools.get(toolName);
  }

  list(): ToolSchema[] {
    return Array.from(this.tools.values());
  }
}
