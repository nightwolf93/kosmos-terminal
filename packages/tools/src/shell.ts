import { ToolSchema } from 'types';

export const shellTool: ToolSchema = {
  name: 'shell',
  permissions: ['process'],
  functions: {
    execute: async (args: { command: string }, ctx) => {
      ctx.logger(`Executing command: ${args.command}`);
      // In a real implementation, this would execute the command in a sandboxed shell
      return { stdout: `Executed: ${args.command}`, stderr: '' };
    },
  },
};
