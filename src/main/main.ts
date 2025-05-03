import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { chatHistories } from './lib/chatgpt';
import MainProcessingService from './services/main';
import { ExecutionContext } from '../types/executionContext';
let mainWindow: BrowserWindow | null;


// Set isDev for development detection
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;


function createWindow() {
  // Get primary display dimensions
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Calculate centered position
  const windowWidth = 1000;
  const windowHeight = 600;
  const x = Math.floor((screenWidth - windowWidth) / 2);
  const y = Math.floor((screenHeight - windowHeight) / 2);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 1000,
    minHeight: 400,
    x: x,
    y: y,
    transparent: true,
    frame: false,
    resizable: true,
    autoHideMenuBar: true,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  console.log("Creating window")
  // Load the app differently based on development or production mode
  if (isDev) {
    // In development, load from webpack dev server
    mainWindow.loadURL('http://localhost:8081');
  } else {
    // In production, load from the built files
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../renderer/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }
}

function setupIPC() {
  // Handler to retrieve chat history if needed
  ipcMain.handle('get-chat-history', async (event, historyId: string) => {
    const history = chatHistories.get(historyId);
    return history || null;
  });

  // Handle form submissions from the renderer
  ipcMain.handle('form-submit', async (event, text: any, chatHistoryId?: string, thinking?: boolean) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return { error: 'Window not available' };
    }
    
    try {
      // Create execution context
      const context = new ExecutionContext(chatHistoryId);
      context.params = {
        thinking,
      }
      // Initialize MainProcessingService
      const mainProcess = new MainProcessingService();
      
      // Create input message
      const input = {
        text: text,
        ts: Date.now()
      };
      
      // Process the form submission and get response
      const update = await mainProcess.processMessage(input, context);
      
      // Send response to renderer
      mainWindow.webContents.send('form-response', update.answer);
      
      // Return formatted answer with history ID for future context
      return {
        text: update.answer.text,
        ts: update.answer.ts,
        data: { 
          chatHistoryId: context.getHistoryId()
        }
      };
    } catch (error: any) {
      console.error('Error processing form submission:', error);
      return {
        text: 'Sorry, there was an error processing your request.',
        ts: Date.now(),
        error: error.message
      };
    }
  });

  // Add a function to send a message from the assistant
  ipcMain.handle('append-assistant-message', (event, message: string, chatHistoryId?: string, timestamp?: number) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Add message to chat history if a history ID is provided
      if (chatHistoryId) {
        const history = chatHistories.get(chatHistoryId);
        if (history) {
          history.messages.push({
            role: 'assistant',
            content: message,
            ts: timestamp || Date.now()
          });
          history.updatedAt = Date.now();
        }
      }
      
      // Send message to renderer
      mainWindow.webContents.send('append-assistant-message', message, timestamp || Date.now());
      return true;
    }
    return false;
  });

  // Add handler for window resize events
  ipcMain.handle('resize-window', (event, height) => {
    if (mainWindow) {
      // Get current window size
      const bounds = mainWindow.getBounds();
      
      // Calculate new height
      const newHeight = Math.max(400, Math.ceil(height) + 60 + 155);
      
      // Just update the height, maintaining current position
      mainWindow.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: newHeight
      });
    }
  });
}

app.on('ready', () => {
  createWindow();
  mainWindow?.show();
  mainWindow?.focus();
  setupIPC();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
    setupIPC();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}); 