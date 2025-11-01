import { useState } from 'react'
import XTerminal from './components/Terminal'
import PlanBoard from './components/PlanBoard'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Plan } from 'types'
import './App.css'

// It's important to declare the ipcRenderer interface for TypeScript
declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, data: any) => void;
      on: (channel: string, func: (event: any, ...args: any[]) => void) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

function App() {
  const [command, setCommand] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [goal, setGoal] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);

  const handleExplain = async () => {
    if (!command) return;
    const result = await window.ipcRenderer.invoke('llm-explain-command', command);
    setExplanation(result);
    setIsOpen(true);
  };

  const handleCreatePlan = async () => {
    if (!goal) return;
    const result = await window.ipcRenderer.invoke('llm-create-plan', goal);
    setPlan(result);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-grow">
            <XTerminal />
          </div>
          <div className="p-2 bg-gray-800 flex items-center">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command to explain"
              className="flex-grow p-2 mr-2 bg-gray-700 text-white rounded"
            />
            <button
              onClick={handleExplain}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Explain Command
            </button>
          </div>
        </div>
        <div className="w-1/3 border-l border-gray-700 overflow-y-auto">
          <div className="p-2 bg-gray-800 flex items-center">
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Enter your goal"
              className="flex-grow p-2 mr-2 bg-gray-700 text-white rounded"
            />
            <button
              onClick={handleCreatePlan}
              className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Plan
            </button>
          </div>
          <PlanBoard plan={plan} />
        </div>
      </div>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="max-w-lg space-y-4 border bg-gray-800 text-white p-6 rounded">
            <DialogTitle className="font-bold">Explanation</DialogTitle>
            <p>{explanation}</p>
            <div className="flex gap-4">
              <button onClick={() => setIsOpen(false)} className="p-2 bg-blue-600 text-white rounded">
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}

export default App
