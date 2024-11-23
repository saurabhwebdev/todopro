import React from 'react';
import useStore from '../store/todoStore';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'react-hot-toast';

export default function QuickActions() {
  const { undo, redo } = useStore();
  const [isListening, setIsListening] = React.useState(false);

  // Voice input handling
  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Voice input is not supported in your browser');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Listening... Speak now');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      useStore.getState().addTodo({
        text,
        priority: 'medium',
        listId: useStore.getState().activeList,
      });
      toast.success('Task added via voice!');
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      toast.error('Voice input failed. Please try again.');
    };

    recognition.start();
  };

  // Keyboard shortcuts
  useHotkeys('ctrl+z', () => { undo(); toast.success('Action undone'); });
  useHotkeys('ctrl+y', () => { redo(); toast.success('Action redone'); });

  const actions = [
    {
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      onClick: () => { undo(); toast.success('Action undone'); }
    },
    {
      label: 'Redo',
      shortcut: 'Ctrl+Y',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      ),
      onClick: () => { redo(); toast.success('Action redone'); }
    },
    {
      label: 'Voice Input',
      shortcut: null,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      onClick: handleVoiceInput,
      isActive: isListening
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3">
      {actions.map((action, index) => (
        <div key={index} className="group relative">
          {/* Tooltip */}
          <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs 
            rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {action.label} {action.shortcut && `(${action.shortcut})`}
          </div>

          {/* Button */}
          <button
            onClick={action.onClick}
            className={`w-12 h-12 rounded-xl flex items-center justify-center 
              transition-all duration-200 shadow-natural hover:shadow-natural-lg
              transform hover:scale-105 group relative
              ${action.isActive 
                ? 'bg-accent-primary text-white animate-pulse' 
                : 'bg-white text-gray-600 hover:text-accent-primary'}`}
            title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
          >
            {action.icon}
          </button>
        </div>
      ))}
    </div>
  );
} 