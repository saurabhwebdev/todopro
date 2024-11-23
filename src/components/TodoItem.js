import React, { useState } from 'react';
import ContentEditable from 'react-contenteditable';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [timeTracking, setTimeTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Format time spent in a human-readable way
  const formatTimeSpent = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours ? `${hours}h ` : ''}${minutes}m`;
  };

  const handleTimeTrack = () => {
    if (!timeTracking) {
      setTimeTracking(true);
      setStartTime(Date.now());
      toast.success('Time tracking started');
    } else {
      setTimeTracking(false);
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      onUpdate(todo.id, { timeSpent: (todo.timeSpent || 0) + timeSpent });
      toast.success(`Time tracked: ${formatTimeSpent(timeSpent)}`);
    }
  };

  const priorityColors = {
    high: 'bg-red-50 text-red-600 border-red-100',
    medium: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    low: 'bg-green-50 text-green-600 border-green-100'
  };

  return (
    <div className={`group bg-white rounded-xl shadow-natural-sm hover:shadow-natural 
      transition-all duration-300 border border-surface-200 hover:border-accent-primary/20
      ${todo.completed ? 'opacity-75' : ''}`}
    >
      {/* Main Task Row */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Checkbox with custom styling */}
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => {
                onToggle(todo.id);
                if (!todo.completed) {
                  toast.success('Task completed! 🎉');
                }
              }}
              className="w-5 h-5 rounded-lg border-2 border-gray-300 
                checked:border-accent-primary checked:bg-accent-primary
                focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary/20
                transition-all duration-200"
            />
            {todo.completed && (
              <svg className="absolute w-3 h-3 text-white pointer-events-none" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} 
                  d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <ContentEditable
              html={todo.text}
              disabled={!isEditing}
              onChange={(e) => onUpdate(todo.id, { text: e.target.value })}
              className={`text-sm outline-none rounded-md transition-all duration-200
                ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}
                ${isEditing ? 'bg-gray-50 px-2 py-1' : ''}`}
            />
            {todo.timeSpent > 0 && (
              <div className="mt-1 text-xs text-gray-400">
                Time spent: {formatTimeSpent(todo.timeSpent)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Priority Badge */}
            <span className={`px-2 py-1 text-xs rounded-md border ${priorityColors[todo.priority]}`}>
              {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
            </span>

            {/* Time Tracking Button */}
            <button
              onClick={handleTimeTrack}
              className={`p-2 rounded-lg transition-colors
                ${timeTracking 
                  ? 'bg-accent-primary/10 text-accent-primary animate-pulse' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
              title={timeTracking ? 'Stop tracking' : 'Start tracking'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-lg transition-colors
                ${isEditing 
                  ? 'bg-accent-primary/10 text-accent-primary' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
              title={isEditing ? 'Save' : 'Edit'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={isEditing 
                    ? "M5 13l4 4L19 7"
                    : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} />
              </svg>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => {
                onDelete(todo.id);
                toast.success('Task deleted');
              }}
              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 
                rounded-lg transition-colors"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Details Section */}
      {showDetails && (
        <div className="px-4 pb-4 pt-2 border-t border-surface-200 animate-slideIn">
          <textarea
            value={todo.notes || ''}
            onChange={(e) => onUpdate(todo.id, { notes: e.target.value })}
            placeholder="Add notes..."
            className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 
              rounded-lg focus:outline-none focus:border-accent-primary 
              focus:ring-2 focus:ring-accent-primary/20 resize-none"
            rows={3}
          />
        </div>
      )}
    </div>
  );
} 