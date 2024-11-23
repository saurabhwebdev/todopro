import { useState } from 'react';
import useStore from '../store/todoStore';
import Help from './Help';

export default function QuickActions() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const actions = [
    {
      label: 'Help',
      shortcut: '?',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => setShowHelp(true)
    },
    {
      label: 'Undo',
      shortcut: '⌘Z',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      onClick: () => useStore.getState().undo()
    },
    {
      label: 'Redo',
      shortcut: '⌘Y',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      ),
      onClick: () => useStore.getState().redo()
    }
  ];

  return (
    <>
      <div className="relative group">
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center 
            transition-all duration-200 shadow-natural hover:shadow-natural-lg
            transform hover:scale-105 bg-white text-cognitive-primary
            ${isExpanded ? 'rotate-45' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        {/* Action Buttons */}
        <div className={`absolute bottom-full right-0 mb-3 space-y-2 transition-all duration-200
          ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
          {actions.map((action, index) => (
            <div key={index} className="group/item relative">
              {/* Tooltip */}
              <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs 
                rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap">
                {action.label} {action.shortcut && `(${action.shortcut})`}
              </div>

              {/* Button */}
              <button
                onClick={action.onClick}
                className="w-12 h-12 rounded-xl flex items-center justify-center 
                  transition-all duration-200 shadow-natural hover:shadow-natural-lg
                  transform hover:scale-105 bg-white text-cognitive-primary
                  hover:text-accent-primary"
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && <Help onClose={() => setShowHelp(false)} />}
    </>
  );
} 