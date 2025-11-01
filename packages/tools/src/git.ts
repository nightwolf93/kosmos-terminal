import { ToolSchema, ToolContext } from 'types';
import git from 'isomorphic-git';
import fs from 'fs';

async function status(args: unknown, ctx: ToolContext) {
  const dir = ctx.cwd;
  const statusMatrix = await git.statusMatrix({ fs, dir });
  return statusMatrix.map(([filepath, head, workdir, stage]) => ({
    filepath,
    head,
    workdir,
    stage,
  }));
}

export const gitTool: ToolSchema = {
  name: 'git',
  permissions: ['fs:read'],
  functions: {
    status,
  },
};
