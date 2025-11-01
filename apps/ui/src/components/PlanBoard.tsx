import { Plan, Step } from 'types';
import React, { useState } from 'react';

interface PlanBoardProps {
  plan: Plan | null;
}

const PlanBoard: React.FC<PlanBoardProps> = ({ plan }) => {
  const handleExecuteStep = async (step: Step) => {
    // For shell commands, the main process will write them directly to the pty.
    // For tools, we'll get a result back that we can then display.
    const result = await window.ipcRenderer.invoke('execute-step', step);

    if (step.tool && result) {
      const output = \`\\n--- Executing: \${step.intent} ---\\n\${JSON.stringify(result, null, 2)}\\n---\\n\`;
      window.ipcRenderer.send('pty-write', output);
    }
  };

  if (!plan) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-xl font-bold mb-4">Plan: {plan.goal}</h2>
      <ul className="space-y-2">
        {plan.steps.map((step) => (
          <li key={step.id} className="p-3 bg-gray-800 rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{step.intent}</div>
                {step.cmd && <code className="text-sm text-green-400">{step.cmd}</code>}
                {step.tool && <code className="text-sm text-blue-400">Tool: {step.tool}</code>}
              </div>
              <button
                onClick={() => handleExecuteStep(step)}
                className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Execute
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanBoard;
