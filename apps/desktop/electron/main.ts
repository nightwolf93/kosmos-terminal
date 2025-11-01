import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import * as pty from 'node-pty';
import os from 'os';
import { LLMConnector, PlannerService, ToolRegistry, PolicyEngine } from 'agent';
import { gitTool } from 'tools';
import { Policy, Step, ToolContext } from 'types';

// Determine the correct shell for the OS
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── main.js
// │ └─┬ dist-electron
// │   ├── main.js
// │   └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST, '../public')
  : process.env.DIST

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = "http://localhost:3000"

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  // --- PTY Setup ---
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });
  ptyProcess.on('data', (data) => win?.webContents.send('pty-data', data));
  ipcMain.on('pty-write', (event, data) => ptyProcess.write(data));

  // --- Agent Setup ---
  const llmConnector = new LLMConnector();
  const plannerService = new PlannerService();
  const toolRegistry = new ToolRegistry();
  toolRegistry.register(gitTool);

  const policy: Policy = {
    mode: 'safe',
    fsAllow: [process.cwd()], // Allow access to the current project directory
    netAllow: [],
    commandDeny: [],
    maxFilesTouched: 10,
    timeoutMs: 10000,
  };
  const policyEngine = new PolicyEngine(policy);

  // --- IPC Handlers ---
  ipcMain.handle('llm-explain-command', (event, command) => llmConnector.explainCommand(command));
  ipcMain.handle('llm-create-plan', (event, goal) => plannerService.createPlan(goal));

  ipcMain.handle('execute-step', async (event, step: Step) => {
    if (step.cmd) {
      ptyProcess.write(step.cmd + '\\r'); // Add carriage return to execute
      return { result: `Executed command: ${step.cmd}` };
    }

    if (!step.tool) {
      return { error: 'No tool or command specified for this step.' };
    }

    const [toolName, functionName] = step.tool.split('.');
    if (!toolName || !functionName) {
      return { error: `Invalid tool format. Expected 'toolName.functionName', but got '${step.tool}'.` };
    }

    const tool = toolRegistry.get(toolName);
    if (!tool) {
      return { error: `Tool "${toolName}" not found.` };
    }

    const cwd = process.cwd(); // In the future, this could be dynamic
    if (!policyEngine.canExecute(tool, cwd)) {
      return { error: `Execution of tool "${toolName}" is denied by the current policy.` };
    }

    const toolFunction = tool.functions[functionName];
    if (!toolFunction) {
      return { error: `Function "${functionName}" not found in tool "${toolName}".` };
    }

    const context: ToolContext = {
      cwd: cwd,
      env: process.env,
      policy: policy,
      logger: (log) => win?.webContents.send('log-message', log),
    };

    try {
      const result = await toolFunction(step.args, context);
      return { result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: errorMessage };
    }
  });
}

// --- App Lifecycle ---
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
});

app.whenReady().then(createWindow);
