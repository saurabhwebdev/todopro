import React from 'react';

export default function Help({ onClose }) {
  const shortcuts = [
    { key: 'Ctrl + N', description: 'Create new task' },
    { key: 'Ctrl + Z', description: 'Undo last action' },
    { key: 'Ctrl + Y', description: 'Redo last action' },
    { key: 'Esc', description: 'Close dialogs' },
    { key: 'Enter', description: 'Save changes' },
  ];

  const features = [
    {
      icon: '✨',
      title: 'Smart Task Management',
      description: 'Create, organize, and track tasks with intuitive controls and natural interactions'
    },
    {
      icon: '⏱️',
      title: 'Time Tracking',
      description: 'Track time spent on tasks to better understand your work patterns'
    },
    {
      icon: '🎯',
      title: 'Priority Levels',
      description: 'Set task priorities to focus on what matters most'
    },
    {
      icon: '🎤',
      title: 'Voice Input',
      description: 'Add tasks hands-free using voice commands'
    },
    {
      icon: '📝',
      title: 'Rich Notes',
      description: 'Add detailed notes and context to your tasks'
    },
    {
      icon: '↩️',
      title: 'Undo/Redo',
      description: 'Made a mistake? Easily undo and redo actions'
    }
  ];

  const tips = [
    'Break large tasks into smaller, manageable steps',
    'Use voice input when your hands are busy',
    'Track time to understand your productivity patterns',
    'Add notes to tasks to provide context for later',
    'Review your progress regularly using statistics'
  ];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-natural-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-surface-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary 
              bg-clip-text text-transparent">
              Welcome to Mindful Tasks! ✨
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Features Section */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 
                    transition-colors duration-200 group cursor-default"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shortcuts.map((shortcut, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg 
                    bg-surface-50 hover:bg-surface-100 transition-colors"
                >
                  <span className="text-sm text-gray-600">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-white rounded-md text-xs font-semibold 
                    text-gray-500 border border-surface-200 shadow-sm">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Pro Tips */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pro Tips 💡</h3>
            <div className="bg-accent-primary/5 rounded-xl p-4">
              <ul className="space-y-3">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="text-accent-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Get Started Button */}
          <div className="text-center pt-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-accent-primary text-white rounded-xl
                hover:bg-accent-primary/90 transition-colors duration-200
                font-medium shadow-natural hover:shadow-natural-lg"
            >
              Got it, let's get started!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 