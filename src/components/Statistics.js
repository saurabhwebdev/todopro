import React from 'react';
import useStore from '../store/todoStore';
import { format, isToday } from 'date-fns';

export default function Statistics() {
  const { todos } = useStore();
  
  // Calculate statistics
  const completedTasks = todos.filter(t => t.completed).length;
  const totalTasks = todos.length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const completedToday = todos.filter(t => t.completed && isToday(new Date(t.completedAt))).length;
  const totalTimeSpent = todos.reduce((acc, todo) => acc + (todo.timeSpent || 0), 0);

  // Format time in hours and minutes
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const stats = [
    {
      label: 'Completed Today',
      value: completedToday,
      icon: (
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: (
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      label: 'Time Invested',
      value: formatTime(totalTimeSpent),
      icon: (
        <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-gray-700">Your Progress</h2>
        <span className="text-xs text-gray-500">{format(new Date(), 'MMMM d, yyyy')}</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`${stat.bgColor} rounded-xl p-3 transition-transform hover:scale-102 
              cursor-default group`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow">
                  {stat.icon}
                </div>
                <div>
                  <div className={`text-sm font-medium ${stat.textColor}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational Message */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {completedToday > 0 
            ? `Great work today! You've completed ${completedToday} task${completedToday > 1 ? 's' : ''} 🎉`
            : "Ready to tackle your first task of the day? 💪"}
        </p>
      </div>
    </div>
  );
} 