import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

// It's important to declare the ipcRenderer interface for TypeScript
declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, data: any) => void;
      on: (channel: string, func: (event: any, ...args: any[]) => void) => void;
    };
  }
}

const XTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);

  useEffect(() => {
    if (terminalRef.current && !terminal.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontFamily: 'monospace',
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(terminalRef.current);
      fitAddon.fit();

      terminal.current = term;

      // Listen for data from the main process and write to the terminal
      window.ipcRenderer.on('pty-data', (event, data) => {
        term.write(data);
      });

      // Send data from the terminal to the main process
      term.onData((data) => {
        window.ipcRenderer.send('pty-write', data);
      });
    }

    return () => {
      terminal.current?.dispose();
      terminal.current = null;
    };
  }, []);

  return <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />;
};

export default XTerminal;
