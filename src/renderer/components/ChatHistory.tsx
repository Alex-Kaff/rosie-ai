import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import MarkdownRenderer from './MarkdownRenderer';
import { WebkitCSSProperties, scrollbarStyles, nonSelectableStyle, selectableStyle } from './styles';

interface ChatHistoryProps {
  messages: ChatMessage[];
  chatHistoryId?: string;
  onNewChat: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, chatHistoryId, onNewChat }) => {
  const historyAreaRef = useRef<HTMLDivElement>(null);

  // Function to ensure the latest message is visible
  const scrollToBottom = () => {
    if (historyAreaRef.current) {
      historyAreaRef.current.scrollTop = historyAreaRef.current.scrollHeight;
    }
  };

  // Effect to scroll to bottom when history changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      {/* Header with conversation info and reset button - no-drag */}
      <div 
        className="flex justify-between items-center mb-3"
        style={{ WebkitAppRegion: 'no-drag', ...nonSelectableStyle } as WebkitCSSProperties}
      >
        <span className="text-xs text-gray-400">
          {messages.length > 0 
            ? `Conversation ID: ${chatHistoryId?.substring(0, 8) || 'New'}`
            : 'Start a new conversation'}
        </span>
        {messages.length > 0 && (
          <button
            onClick={onNewChat}
            className="text-xs text-gray-400 hover:text-white"
            title="Start a new conversation"
          >
            New Chat
          </button>
        )}
      </div>
      
      {/* Scrollable history area - draggable background */}
      <div 
        ref={historyAreaRef}
        className="flex-grow overflow-y-auto mb-4" 
        style={{ 
          ...scrollbarStyles,
          maxHeight: '400px',
          overflowY: 'auto',
          ...nonSelectableStyle
        }}
      >
        {messages && messages.length !== 0 && (
          <div>
            {messages.map((message, index) => (
              <div 
                key={index}
                className="mt-3 p-2 bg-gray-700 text-white rounded-md text-sm"
                style={{ WebkitAppRegion: 'no-drag', ...selectableStyle } as WebkitCSSProperties}
              >
                <label className={`font-mono text-xs ${message.role === 'user' ? 'text-blue-300' : 'text-green-300'} block mb-1`}>
                  {message.role === 'user' ? 'You' : 'Assistant'} ({new Date(message.ts || Date.now()).toLocaleTimeString()}): 
                </label>
                {message.role === 'assistant' ? (
                  <MarkdownRenderer content={message.content} />
                ) : (
                  message.content
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ChatHistory; 