import { Answer, ContextUpdate, Input, Action, Memory } from "../../types/";
import { Service } from "../../types/service";
import { getChatGPTResponse, getOrCreateChatHistory } from "../lib/chatgpt";
import { ExecutionContext } from "../../types/executionContext";
import { BrowserWindow, dialog } from "electron";
import { searchEverything } from "../lib/everything";
import { FileStore } from "../lib/filestore";
import { exec } from "child_process";

export const memoryStore = new FileStore<Memory>('memory.json', {items: []});

class MainProcessingService implements Service<never> {
    async processMessage(message: Input, context: ExecutionContext): Promise<ContextUpdate> {
        // Process the incoming message using ChatGPT directl
        const response = await getChatGPTResponse(message.text, context, {thinking: context.params.thinking});
        const answer: Answer = {
            text: response.text,
            ts: Date.now()
        };

        const action: Action = {
            type: "produce_text",
            params: {
                inputMessage: message
            },
            result: response.text
        };

        let update: ContextUpdate = {answer, actions: [action], actionRequests: response.actionRequests};
        context.update(update);
        
        if (response.actionRequests && response.actionRequests.length > 0) {
            // Execute the actions
            for (const action of response.actionRequests) {
                if (action.type === "delete_conversation") {
                    // Send event to renderer process to start a new conversation
                    const mainWindow = BrowserWindow.getFocusedWindow();
                    if (mainWindow) {
                        mainWindow.webContents.send('start-new-conversation');
                    }

                    action.result = true;
                } else if (action.type === "search_pc") {
                    // Search the pc for the query
                    const results = await searchEverything((action.params as { query: string }).query);

                    const searchAnalysis = await getChatGPTResponse(
                        `The results of the search are as follows:
                        ${JSON.stringify(results)}

                        Please analyze the results and provide a detailed analysis of the results based on the original query. You can not call any additional actions for this query.
                        `,
                        context,
                        {
                            role: "system",
                            dontUpdateHistory: true
                        }
                    )
                    action.result = searchAnalysis.text;
                    console.log(`Search analysis: ${searchAnalysis.text}`);
                } else if (action.type === "add_memory") {
                    // Add a memory about the user
                    const memory = await memoryStore.load();
                    memory.items.push({text: (action.params as {text: string}).text, date: Date.now()});
                    await memoryStore.save(memory);
                    action.result = true;
                } else if (action.type === "run_cmd") {
                    // Run a command on the pc
                    const cmd = (action.params as {cmd: string}).cmd;
                    try {
                        const { stdout, stderr } = await new Promise<{stdout: string, stderr: string}>(async (resolve, reject) => {
                            const confirmed = await showPopupDialog("Confirm Command", cmd, "Yes, Run it!");
                            if (!confirmed) {
                                resolve({stdout: "", stderr: "User canceled the action"});
                                return;
                            }
                            exec(cmd, (error, stdout, stderr) => {
                                if (error) {
                                    resolve({stdout, stderr: error.message});
                                } else {
                                    resolve({ stdout, stderr });
                                }
                            });
                        });
                        action.result = stdout || stderr;
                    } catch (error) {
                        action.result = (error as Error).message;
                    }
                }
            }

            const newResponse = await getChatGPTResponse(`
                You have performed the following actions:
                ${JSON.stringify(response.actionRequests)}

                Based on the results, formulate a final answer to the user's query. You can not call any additional actions for this query.
                `, context, {thinking: false, role: "system"});

            const newUpdate: ContextUpdate = {answer: {text: newResponse.text, ts: Date.now()}, actions: [], actionRequests: []};
            context.update(newUpdate);
            return newUpdate;
        } else {
            return update;
        }
    } 
}

export default MainProcessingService;

// Example function to append a message from the assistant
// You can call this from anywhere in the backend
export function appendAssistantMessage(message: string, chatHistoryId?: string, timestamp?: number) {
  // Get the focused window
  const { BrowserWindow } = require('electron');
  const mainWindow = BrowserWindow.getFocusedWindow();
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Send the message directly to the renderer process
    mainWindow.webContents.send('append-assistant-message', message, timestamp);
    
    return true;
  }
  return false;
}

export function showPopupDialog(title: string, message: string, okButtonText: string = "OK"): Promise<boolean> {
  // Use electron's dialog module
  const mainWindow = BrowserWindow.getFocusedWindow();
  
  // Define the return type from showMessageBox
  interface MessageBoxReturnValue {
    response: number;
    checkboxChecked?: boolean;
  }
  
  return new Promise((resolve) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      // If no window is available, resolve with false
      resolve(false);
      return;
    }
    
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: title,
      message: message,
      buttons: [okButtonText, 'Cancel'],
      defaultId: 0,
      cancelId: 1
    }).then((result: MessageBoxReturnValue) => {
      // Return true if OK button (index 0) was clicked
      resolve(result.response === 0);
    }).catch(() => {
      // In case of error, resolve with false
      resolve(false);
    });
  });
}