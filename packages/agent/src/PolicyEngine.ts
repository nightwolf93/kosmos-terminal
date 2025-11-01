import { Policy, ToolSchema } from 'types';
import path from 'path';

export class PolicyEngine {
  private policy: Policy;

  constructor(policy: Policy) {
    this.policy = policy;
  }

  canExecute(tool: ToolSchema, cwd: string): boolean {
    if (this.policy.mode === 'headless') {
      return true; // Assume headless mode is always trusted for now
    }

    if (!tool.permissions) {
      return true; // No permissions required
    }

    for (const permission of tool.permissions) {
      if (permission === 'fs:read') {
        // This is a simplified check. A real implementation would need to handle this more robustly.
        if (!this.policy.fsAllow.some(allowedPath => cwd.startsWith(allowedPath))) {
          return false;
        }
      } else if (permission.startsWith('fs:read:')) {
        const path = permission.split(':')[2];
        if (!this.policy.fsAllow.some(allowedPath => path.startsWith(allowedPath))) {
          return false;
        }
      } else if (permission.startsWith('net:')) {
        const host = permission.split(':')[1];
        if (!this.policy.netAllow.includes(host)) {
          return false;
        }
      } else if (this.policy.commandDeny.includes(tool.name)) {
        return false;
      }
    }

    return true;
  }
}
