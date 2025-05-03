import React, { useState, useRef, FormEvent, ChangeEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  thinking: boolean;
  onThinkingChange: (thinking: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoading, thinking, onThinkingChange }) => {
  const [inputText, setInputText] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    onSubmit(inputText);
    setInputText('');
  };

  // Handle key press in textarea
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Auto-resize textarea based on content
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInputText(textarea.value);
    
    // Reset height to calculate based on content
    textarea.style.height = 'auto';
    
    // Set the height based on scrollHeight with a max height
    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = `${newHeight}px`;
  };

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className="flex flex-col space-y-2"
    >
      <textarea
        value={inputText}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter your text here (Shift+Enter for new line)"
        className="w-full p-2 text-sm rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none overflow-y-auto"
        disabled={isLoading}
        rows={1}
        style={{
          minHeight: '38px',
          maxHeight: '150px'
        }}
      />
      
      <div className="flex justify-between items-center">
        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <span>Thinking</span>
          <input
            type="checkbox"
            checked={thinking}
            onChange={(e) => onThinkingChange(e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-500 rounded bg-gray-700 border-gray-600"
          />
        </label>
        
        <button
          type="submit"
          className={`px-4 py-2 rounded-md text-white text-sm ${isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Submit'}
        </button>
      </div>
    </form>
  );
};

export default ChatInput; 