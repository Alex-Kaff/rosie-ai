import React, { useState, useRef, useEffect } from 'react';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { ChatMessage, ChatEntry, Answer } from '../types';

// Import the Rosie image
import rosieImage from './assets/rosie-sitting.png';

// Import components
import { 
  Notification, 
  ChatInput, 
  ChatHistory, 
  WebkitCSSProperties, 
  nonSelectableStyle 
} from './components';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatHistoryId, setChatHistoryId] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [thinking, setThinking] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Function to append an assistant message directly
  const appendAssistantMessage = (text: string, timestamp?: number) => {
    const ts = timestamp || Date.now();
    setMessages(prevMessages => [
      ...prevMessages,
      {
        role: 'assistant',
        content: text,
        ts
      }
    ]);
  };

  // Notification effect - auto dismiss after timeout
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000); // Show notification for 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // Listen for start-new-conversation event from main process
  useEffect(() => {
    const handleNewConversation = () => {
      showNotification('Started a new conversation', 'info');
      startNewConversation();
    };

    const handleAppendAssistantMessage = (_: IpcRendererEvent, message: string, timestamp?: number) => {
      appendAssistantMessage(message, timestamp);
    };
    
    ipcRenderer.on('start-new-conversation', handleNewConversation);
    
    // Listen for append-assistant-message from backend
    ipcRenderer.on('append-assistant-message', handleAppendAssistantMessage);
    
    return () => {
      ipcRenderer.removeListener('start-new-conversation', handleNewConversation);
      ipcRenderer.removeListener('append-assistant-message', handleAppendAssistantMessage);
    };
  }, []);
  
  // Window resize effect
  useEffect(() => {
    // Request initial resize after component mounts
    const initialResize = setTimeout(() => {
      updateWindowSize();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      updateWindowSize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(initialResize);
      resizeObserver.disconnect();
    };
  }, [messages]); // Recalculate when messages changes

  // Function to calculate and update window size
  const updateWindowSize = () => {
    if (containerRef.current && formRef.current) {
      // Get the form height (this will be fixed)
      const formHeight = formRef.current.getBoundingClientRect().height;
      
      // Calculate the appropriate height based on content
      let contentHeight = 0;
      
      if (messages.length === 0) {
        // Default height for empty chat
        contentHeight = 600;
      } else {
        // Increase height based on content, with a limit
        contentHeight = Math.min(800, 600 + messages.length * 50);
      }
      
      // Send the dimensions to resize the window
      ipcRenderer.invoke('resize-window', contentHeight);
    }
  };

  // Show notification helper function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  const handleSubmit = async (inputText: string) => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    const ts = Date.now();

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText,
      ts
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      // Call the backend function through IPC, passing the chat history ID if we have one
      const result = await ipcRenderer.invoke('form-submit', inputText, chatHistoryId, thinking) as Answer;
      
      // Store the history ID for future requests if one was returned
      if (result.data?.chatHistoryId) {
        setChatHistoryId(result.data.chatHistoryId);
      }
      
      if (thinking) {
        // Remove the last element (the "Thinking..." placeholder) and add the actual response
        setMessages(prevMessages => {
          const updatedMessages = prevMessages.filter((msg, idx) => 
            !(idx === prevMessages.length - 1 && msg.role === 'assistant' && msg.content === 'Thinking...')
          );
          return [
            ...updatedMessages,
            {
              role: 'assistant',
              content: result.text,
              ts: result.ts || Date.now()
            }
          ];
        });
      } else {
        // Add the assistant response
        appendAssistantMessage(result.text, result.ts);
      }
      
    } catch (error) {
      // Log error only in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Error calling backend:', error);
      }
      
      // If thinking was shown, remove it on error
      if (thinking) {
        setMessages(prevMessages => 
          prevMessages.filter((msg, idx) => 
            !(idx === prevMessages.length - 1 && msg.role === 'assistant' && msg.content === 'Thinking...')
          )
        );
      }
      
      showNotification('Failed to send message', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to start a new conversation
  const startNewConversation = () => {
    setChatHistoryId(undefined);
    setMessages([]);
    showNotification('Started a new conversation', 'info');
  };

  return (
    <>
    {/* Rosie Image - Absolute Position */}
    <div 
      className="absolute w-full z-10" 
      style={{ WebkitAppRegion: 'drag', height: '236px', ...nonSelectableStyle } as WebkitCSSProperties}
    >
      <img 
        src={rosieImage} 
        alt="Rosie" 
        className="absolute left-3" 
        style={{ height: '236px', ...nonSelectableStyle } as WebkitCSSProperties}
      />
    </div>
    {/* 155px spacer for Rosie image positioning */}
    <div className="h-[155px]" style={{ WebkitAppRegion: 'drag', ...nonSelectableStyle } as WebkitCSSProperties}></div>
    <div 
      className="flex flex-col w-full p-4 bg-gray-900 top-[155px]"
      style={{ WebkitAppRegion: 'drag', ...nonSelectableStyle } as WebkitCSSProperties}
    >
      <div 
        ref={containerRef}
        className="w-full p-6 rounded-xl shadow-lg flex flex-col relative" 
        style={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', ...nonSelectableStyle }}
      >
        
        {/* Title Bar */}
        <div 
          className="flex justify-end items-center mb-4 pb-2 border-b border-gray-700"
          style={{ WebkitAppRegion: 'drag', ...nonSelectableStyle } as WebkitCSSProperties}
        >
          <h1 className="text-xl font-bold text-blue-400 mr-6">Rosie AI</h1>
        </div>
        
        <div className="flex flex-col h-full w-full">
          {/* Chat History Component */}
          <ChatHistory 
            messages={messages} 
            chatHistoryId={chatHistoryId} 
            onNewChat={startNewConversation} 
          />

          {/* Fixed input area - no-drag */}
          <div 
            className="flex-shrink-0 mt-auto"
            style={{ WebkitAppRegion: 'no-drag', ...nonSelectableStyle } as WebkitCSSProperties}
          >
            <div ref={formRef}>
              <ChatInput 
                onSubmit={handleSubmit} 
                isLoading={isLoading} 
                thinking={thinking} 
                onThinkingChange={setThinking} 
              />
            </div>
            
            {/* Notification area */}
            {notification && <Notification message={notification.message} type={notification.type} />}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default App; 