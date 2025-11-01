import { Plan, Step } from 'types';
import React from 'react';

interface PlanBoardProps {
  plan: Plan | null;
}

const PlanBoard: React.FC<PlanBoardProps> = ({ plan }) => {
  if (!plan) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-xl font-bold mb-4">Plan: {plan.goal}</h2>
      <ul className="space-y-2">
        {plan.steps.map((step) => (
          <li key={step.id} className="p-3 bg-gray-800 rounded">
            <div className="font-semibold">{step.intent}</div>
            {step.cmd && <code className="text-sm text-green-400">{step.cmd}</code>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanBoard;
