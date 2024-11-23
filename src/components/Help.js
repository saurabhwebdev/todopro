import React from 'react';

export default function Help({ onClose }) {
  const sections = [
    {
      title: "Getting Started with FoxTasks 🦊",
      content: [
        {
          icon: "🎯",
          title: "Create Spaces",
          description: "Organize your tasks into different spaces like Work, Personal, or Projects"
        },
        {
          icon: "✨",
          title: "Add Tasks",
          description: "Quickly add tasks with priorities and track your progress"
        },
        {
          icon: "📱",
          title: "Mobile Friendly",
          description: "Use gestures on mobile: swipe right to complete, left to delete"
        }
      ]
    },
    {
      title: "Smart Features 💡",
      content: [
        {
          icon: "⌨️",
          title: "Keyboard Shortcuts",
          description: "Ctrl+N: New Task\nCtrl+Z: Undo\nCtrl+Y: Redo\nEsc: Close dialogs",
          isCode: true
        },
        {
          icon: "🔄",
          title: "Task Management",
          description: "Drag & drop to reorder tasks\nSwipe gestures on mobile\nAutomatic priority adjustment"
        },
        {
          icon: "📊",
          title: "Progress Tracking",
          description: "Daily completion stats\nStreak tracking\nVisual progress indicators"
        }
      ]
    },
    {
      title: "Organization Tips 📝",
      content: [
        {
          icon: "⭐",
          title: "Favorite Spaces",
          description: "Mark frequently used spaces as favorites for quick access"
        },
        {
          icon: "🎨",
          title: "Custom Icons",
          description: "Personalize your spaces with custom emoji icons"
        },
        {
          icon: "🎯",
          title: "Priority Levels",
          description: "Use High, Medium, Low priorities to organize tasks effectively"
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-natural-lg max-w-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-surface-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-natural flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Fox Icon SVG - Same as sidebar */}
                  <path d="M8 18C8 14 24 14 24 18C24 23 19 26 16 26C13 26 8 23 8 18Z" className="fill-[#ff9f43]"/>
                  <path d="M11 18.5C11 16.5 21 16.5 21 18.5C21 22 18 23.5 16 23.5C14 23.5 11 22 11 18.5Z" fill="white"/>
                  {/* ... rest of the fox icon ... */}
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff9f43] to-[#e17055] bg-clip-text text-transparent">
                Welcome to FoxTasks!
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-cognitive-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-lg font-semibold text-cognitive-primary">
                {section.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {section.content.map((item, itemIndex) => (
                  <div 
                    key={itemIndex}
                    className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 
                      transition-colors duration-200 group cursor-default"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                      <div>
                        <h4 className="font-medium text-cognitive-primary mb-1">
                          {item.title}
                        </h4>
                        {item.isCode ? (
                          <pre className="text-xs text-cognitive-tertiary font-mono bg-surface-100 p-2 rounded-lg">
                            {item.description}
                          </pre>
                        ) : (
                          <p className="text-sm text-cognitive-tertiary">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Quick Start Guide */}
          <div className="mt-8 p-4 rounded-xl bg-gradient-natural">
            <h3 className="text-lg font-semibold text-cognitive-primary mb-4">
              Quick Start Guide 🚀
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-cognitive-secondary">
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-medium">1</span>
                <span>Create a new space for your tasks</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-cognitive-secondary">
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-medium">2</span>
                <span>Add your first task with priority</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-cognitive-secondary">
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-medium">3</span>
                <span>Organize and track your progress</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 