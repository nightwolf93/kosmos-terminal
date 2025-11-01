import { useState } from 'react'
import XTerminal from './components/Terminal'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
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

  const handleExplain = async () => {
    if (!command) return;
    const result = await window.ipcRenderer.invoke('llm-explain-command', command);
    setExplanation(result);
    setIsOpen(true);
  };

  return (
    <div className="flex flex-col h-screen">
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
