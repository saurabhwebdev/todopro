import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import useStore from './store/todoStore';
import TodoItem from './components/TodoItem';
import Statistics from './components/Statistics';
import QuickActions from './components/QuickActions';
import Help from './components/Help';
import { useHotkeys } from 'react-hotkeys-hook';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import toast, { Toaster } from 'react-hot-toast';
import { isToday } from 'date-fns';
import { useSpring, animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';

function App() {
  const { 
    lists, 
    todos, 
    activeList,
    settings,
    addList, 
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    undo,
    redo
  } = useStore();

  // Task-related state
  const [input, setInput] = useState('');
  const [todoPriority, setTodoPriority] = useState('medium');
  const [showTodoForm, setShowTodoForm] = useState(false);
  
  // List-related state
  const [listInput, setListInput] = useState('');
  const [listIcon, setListIcon] = useState('📝');
  const [showListForm, setShowListForm] = useState(false);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(() => {
    // Show help on first visit
    const hasVisited = localStorage.getItem('has-visited');
    if (!hasVisited) {
      localStorage.setItem('has-visited', 'true');
      return true;
    }
    return false;
  });

  // Remove the duplicate state declarations that were here before
  const { width, height } = useWindowSize();

  // Common emojis for list icons
  const commonEmojis = ['📝', '🏠', '💼', '🎯', '💡', '📚', '🎨', '🏃‍♂️', '🛒', '✨'];

  // Keyboard shortcuts setup
  useHotkeys('ctrl+z', (e) => { e.preventDefault(); undo(); toast('Undo successful'); });
  useHotkeys('ctrl+y', (e) => { e.preventDefault(); redo(); toast('Redo successful'); });
  useHotkeys('ctrl+n', (e) => { e.preventDefault(); setShowTodoForm(true); });
  useHotkeys('esc', () => { setShowTodoForm(false); setShowListForm(false); });

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    addTodo({
      text: input,
      listId: activeList,
      priority: todoPriority,
    });
    setInput('');
    setTodoPriority('medium');
    toast.success('Task added successfully! 📝');
  };

  const handleAddList = (e) => {
    e.preventDefault();
    if (listInput.trim()) {
      addList({
        name: listInput.trim(),
        icon: listIcon,
        isDefault: false,
        isFavorite: false
      });
      setListInput('');
      setListIcon('📝');
      setShowListForm(false);
      toast.success('Space created successfully! 🎉');
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(todos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update priorities based on new position
    const updatedItems = items.map((item, index) => {
      const priority = index < items.length / 3 ? 'high' 
        : index < (items.length * 2) / 3 ? 'medium' 
        : 'low';
      return { ...item, priority };
    });

    useStore.setState({ todos: updatedItems });
  };

  const filteredTodos = todos
    .filter(todo => todo.listId === activeList)
    .filter(todo => showCompleted ? true : !todo.completed)
    .filter(todo => 
      todo.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      todo.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.completed === b.completed) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.completed ? 1 : -1;
  });

  // Add this new function to handle reset
  const handleReset = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to reset everything? This cannot be undone.')) {
      useStore.setState({
        lists: [{ id: 1, name: 'My Tasks', isDefault: true, icon: '📝' }],
        todos: [],
        activeList: 1,
        undoStack: [],
        redoStack: [],
        statistics: {
          completedToday: 0,
          streak: 0,
          lastCompleted: null,
          completedTodayIds: [],
        }
      });
      toast.success('Everything has been reset');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-natural">
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#334155',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }
        }} 
      />
      
      <div className="h-screen flex flex-col md:flex-row">
        {/* Sidebar - Now conditionally rendered */}
        <div className="md:hidden">
          <MobileHeader 
            lists={lists} 
            activeList={activeList}
            setShowTodoForm={setShowTodoForm}
            setShowListForm={setShowListForm}
          />
        </div>
        
        <div className="hidden md:flex">
          <Sidebar 
            lists={lists} 
            activeList={activeList} 
            todos={todos}
            setShowTodoForm={setShowTodoForm}
            setShowListForm={setShowListForm}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-glass-gradient backdrop-blur-sm border-b border-surface-200 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center justify-between md:gap-4">
                <h1 className="text-lg md:text-xl font-semibold text-gray-900">
                  {lists.find(list => list.id === activeList)?.name}
                </h1>
                <span className="px-2.5 py-1 bg-surface-100 text-gray-600 rounded-lg text-sm">
                  {todos.filter(todo => todo.listId === activeList).length} tasks
                </span>
              </div>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                <div className="relative flex-1 md:flex-none">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 px-4 py-2 pl-10 bg-surface-50 border border-surface-200 rounded-xl
                      focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
                      text-sm placeholder-surface-300"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-300" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={() => setShowTodoForm(true)}
                  className="px-4 py-2 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/90
                    transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Task
                </button>
              </div>
            </div>

            {/* Task Form - Make it responsive */}
            {showTodoForm && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="w-full max-w-lg bg-white rounded-2xl border border-surface-200 
                  animate-slideIn shadow-natural-lg overflow-hidden max-h-[90vh] my-auto">
                  {/* Form Header */}
                  <div className="sticky top-0 bg-white border-b border-surface-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-cognitive-primary">New Task</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTodoForm(false)}
                      className="p-2 hover:bg-surface-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-cognitive-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Form Content - Make it scrollable if needed */}
                  <div className="overflow-y-auto">
                    <form onSubmit={handleAddTodo} className="p-6 space-y-6">
                      {/* Task Input */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-cognitive-primary">
                          What needs to be done?
                        </label>
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Enter your task here..."
                          className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl
                            focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
                            text-cognitive-primary placeholder-cognitive-tertiary text-base"
                          autoFocus
                        />
                      </div>

                      {/* Priority Selection */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-cognitive-primary">
                          Priority Level
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'low', label: 'Low', color: 'emerald', icon: (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                              </svg>
                            )},
                            { value: 'medium', label: 'Medium', color: 'amber', icon: (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            )},
                            { value: 'high', label: 'High', color: 'rose', icon: (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            )}
                          ].map((priority) => (
                            <button
                              key={priority.value}
                              type="button"
                              onClick={() => setTodoPriority(priority.value)}
                              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                ${todoPriority === priority.value
                                  ? priority.value === 'high'
                                    ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-600/20'
                                    : priority.value === 'medium'
                                      ? 'bg-amber-50 text-amber-600 ring-2 ring-amber-600/20'
                                      : 'bg-emerald-50 text-emerald-600 ring-2 ring-emerald-600/20'
                                  : 'bg-surface-50 text-cognitive-tertiary hover:bg-surface-100'
                                }
                              `}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <span className={`transition-colors duration-200
                                  ${todoPriority === priority.value
                                    ? priority.value === 'high'
                                      ? 'text-rose-600'
                                      : priority.value === 'medium'
                                        ? 'text-amber-600'
                                        : 'text-emerald-600'
                                    : 'text-cognitive-tertiary'
                                  }`}
                                >
                                  {priority.icon}
                                </span>
                                {priority.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Form Footer */}
                      <div className="px-6 py-4 bg-surface-50 border-t border-surface-200 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowTodoForm(false)}
                          className="px-4 py-2 text-cognitive-secondary hover:text-cognitive-primary 
                            hover:bg-surface-100 rounded-lg transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!input.trim()}
                          className="px-6 py-2 bg-accent-primary text-white rounded-lg 
                            hover:bg-accent-primary/90 transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                            text-sm font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Add Task
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="rounded border-surface-200 text-accent-primary 
                      focus:ring-accent-primary focus:ring-offset-0"
                  />
                  <label className="text-sm text-gray-600">Show completed tasks</label>
                </div>
              </div>

              {sortedTodos.length > 0 ? (
                <div className="md:block"> {/* Desktop View */}
                  <div className="hidden md:block">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="todos">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {sortedTodos.map((todo, index) => (
                              <Draggable
                                key={todo.id}
                                draggableId={todo.id.toString()}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                                  >
                                    <TodoItem
                                      todo={todo}
                                      onToggle={toggleTodo}
                                      onDelete={deleteTodo}
                                      onUpdate={updateTodo}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                  
                  {/* Mobile View with Swipe Gestures */}
                  <div className="md:hidden space-y-2">
                    {sortedTodos.map(todo => (
                      <SwipeableTodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onUpdate={updateTodo}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyTasksAnimation setShowTodoForm={setShowTodoForm} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Make it responsive */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <QuickActions />
      </div>

      {showHelp && <Help onClose={() => setShowHelp(false)} />}

      {/* List Creation Form */}
      {showListForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-natural-lg w-full max-w-md animate-slideIn">
            <form onSubmit={handleAddList} className="p-6">
              <h2 className="text-xl font-semibold text-cognitive-primary mb-4">Create New Space</h2>
              
              {/* Icon Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-cognitive-secondary mb-2">
                  Choose an Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setListIcon(emoji)}
                      className={`p-2 text-xl rounded-lg transition-all ${
                        listIcon === emoji 
                          ? 'bg-accent-primary/10 scale-110' 
                          : 'hover:bg-surface-hover'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-cognitive-secondary mb-2">
                  Space Name
                </label>
                <input
                  type="text"
                  value={listInput}
                  onChange={(e) => setListInput(e.target.value)}
                  placeholder="Enter space name..."
                  className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl
                    focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowListForm(false);
                    setListInput('');
                    setListIcon('📝');
                  }}
                  className="px-4 py-2 text-cognitive-secondary hover:bg-surface-hover rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!listInput.trim()}
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Add new MobileHeader component
function MobileHeader({ lists, activeList, setShowTodoForm, setShowListForm }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white border-b border-surface-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Fox Icon SVG */}
          </svg>
          <h1 className="text-lg font-bold bg-gradient-to-r from-[#ff9f43] to-[#e17055]
            bg-clip-text text-transparent">
            FoxTasks
          </h1>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-cognitive-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setShowMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-natural-lg"
            onClick={e => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-cognitive-primary">Spaces</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-cognitive-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-2">
                {lists.map(list => (
                  <ListItem 
                    key={list.id} 
                    list={list} 
                    isActive={activeList === list.id}
                    onClick={() => {
                      useStore.setState({ activeList: list.id });
                      setShowMenu(false);
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  setShowListForm(true);
                  setShowMenu(false);
                }}
                className="mt-4 w-full px-4 py-2 bg-accent-primary text-white rounded-lg
                  hover:bg-accent-primary/90 transition-colors text-sm font-medium
                  flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Space
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add this new component for the sidebar
function Sidebar({ lists, activeList, todos, setShowTodoForm, setShowListForm }) {
  const [expandedSection, setExpandedSection] = useState('spaces');
  const [showStats, setShowStats] = useState(false);
  const { width } = useWindowSize();
  const isWideScreen = width > 1280;

  // Cognitive grouping of lists
  const groupedLists = {
    favorites: lists.filter(list => list.isFavorite),
    recent: lists.filter(list => !list.isFavorite).slice(0, 3),
    all: lists
  };

  const EmptyStateAnimation = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <svg 
        className="w-48 h-48 mb-4" 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle 
          cx="100" 
          cy="100" 
          r="80" 
          className="fill-accent-primary/5"
        />

        {/* Animated Elements */}
        <g className="animate-float">
          <rect 
            x="70" 
            y="60" 
            width="60" 
            height="20" 
            rx="6" 
            className="fill-accent-primary/20"
          >
            <animate
              attributeName="y"
              values="60;65;60"
              dur="3s"
              repeatCount="indefinite"
            />
          </rect>
        </g>

        <g className="animate-float" style={{ animationDelay: '0.5s' }}>
          <rect 
            x="60" 
            y="90" 
            width="80" 
            height="20" 
            rx="6" 
            className="fill-accent-secondary/20"
          >
            <animate
              attributeName="y"
              values="90;95;90"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </rect>
        </g>

        <g className="animate-float" style={{ animationDelay: '1s' }}>
          <rect 
            x="75" 
            y="120" 
            width="50" 
            height="20" 
            rx="6" 
            className="fill-accent-tertiary/20"
          >
            <animate
              attributeName="y"
              values="120;125;120"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </rect>
        </g>

        {/* Animated Plus Icons */}
        <g className="animate-pulse">
          <path 
            d="M50 100 h10 M55 95 v10" 
            className="stroke-accent-primary" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </g>
        <g className="animate-pulse" style={{ animationDelay: '0.5s' }}>
          <path 
            d="M140 80 h10 M145 75 v10" 
            className="stroke-accent-secondary" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </g>
        <g className="animate-pulse" style={{ animationDelay: '1s' }}>
          <path 
            d="M130 130 h10 M135 125 v10" 
            className="stroke-accent-tertiary" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </g>

        {/* Orbiting Dots */}
        <circle cx="100" cy="100" r="2" className="fill-accent-primary">
          <animateMotion
            path="M0 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0"
            dur="5s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="100" cy="100" r="1.5" className="fill-accent-secondary">
          <animateMotion
            path="M0 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0"
            dur="7s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      <h3 className="text-lg font-semibold text-cognitive-primary mb-2">
        Create Your First Space
      </h3>
      <p className="text-sm text-cognitive-secondary mb-4 max-w-[200px]">
        Organize your tasks into spaces to stay focused and productive
      </p>
      <button
        onClick={() => setShowListForm(true)}
        className="px-4 py-2 bg-accent-primary text-white rounded-lg
          hover:bg-accent-primary/90 transition-all duration-200
          flex items-center gap-2 text-sm font-medium group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:rotate-90" 
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 4v16m8-8H4" />
        </svg>
        New Space
      </button>
    </div>
  );

  return (
    <div className="w-80 flex flex-col h-full bg-white border-r border-surface-200">
      {/* Branding Section - Compact */}
      <div className="px-4 py-3 border-b border-surface-200">
        <div className="flex items-center gap-3">
          {/* Fox Icon - Larger without container */}
          <svg className="w-12 h-12" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Main Body */}
            <path 
              d="M8 18C8 14 24 14 24 18C24 23 19 26 16 26C13 26 8 23 8 18Z" 
              className="fill-[#ff9f43]"
            />
            
            {/* White Belly */}
            <path 
              d="M11 18.5C11 16.5 21 16.5 21 18.5C21 22 18 23.5 16 23.5C14 23.5 11 22 11 18.5Z" 
              fill="white"
            />
            
            {/* Face */}
            <g>
              {/* Eyes */}
              <circle cx="13.5" cy="18" r="1.2" fill="#2d3436" />
              <circle cx="18.5" cy="18" r="1.2" fill="#2d3436" />
              {/* Eye Shine */}
              <circle cx="13.8" cy="17.7" r="0.4" fill="white" />
              <circle cx="18.8" cy="17.7" r="0.4" fill="white" />
              
              {/* Nose */}
              <path 
                d="M15.7 19.5 Q16 20 16.3 19.5" 
                stroke="#2d3436" 
                strokeWidth="0.8" 
                strokeLinecap="round"
              />
            </g>
            
            {/* Ears */}
            <path 
              d="M10 16 L8 12 L12 14 Z" 
              className="fill-[#ff9f43]"
            />
            <path 
              d="M22 16 L24 12 L20 14 Z" 
              className="fill-[#ff9f43]"
            />
            
            {/* Inner Ears */}
            <path 
              d="M10.5 15 L9.5 13 L11.5 14 Z" 
              className="fill-[#e17055]"
            />
            <path 
              d="M21.5 15 L22.5 13 L20.5 14 Z" 
              className="fill-[#e17055]"
            />
          </svg>

          <h1 className="text-xl font-bold bg-gradient-to-r from-[#ff9f43] to-[#e17055]
            bg-clip-text text-transparent">
            FoxTasks
          </h1>
        </div>
      </div>

      {/* Quick Actions - Single Row */}
      <div className="flex gap-2 p-2 border-b border-surface-200">
        <button
          onClick={() => setShowTodoForm(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
            bg-surface-focus hover:bg-surface-hover transition-all duration-200 group"
        >
          <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium text-cognitive-primary">New Task</span>
        </button>
        
        <button
          onClick={() => setShowListForm(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
            bg-surface-focus hover:bg-surface-hover transition-all duration-200 group"
        >
          <svg className="w-4 h-4 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-sm font-medium text-cognitive-primary">New Space</span>
        </button>
      </div>

      {/* Main Navigation - Expanded */}
      <div className="flex-1 overflow-y-auto">
        {lists.length === 0 ? (
          <EmptyStateAnimation />
        ) : (
          <>
            {/* Favorites Section */}
            {groupedLists.favorites.length > 0 && (
              <div className="px-2 py-2">
                <div className="flex items-center justify-between px-2 py-1 text-sm text-cognitive-secondary">
                  <span className="font-medium">Favorites</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-surface-100">
                    {groupedLists.favorites.length}
                  </span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {groupedLists.favorites.map(list => (
                    <ListItem key={list.id} list={list} isActive={activeList === list.id} />
                  ))}
                </div>
              </div>
            )}

            {/* All Spaces */}
            <div className="px-2 pt-2 flex-1">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className="text-sm font-medium text-cognitive-primary">All Spaces</span>
                <button
                  onClick={() => setShowListForm(true)}
                  className="p-1 hover:bg-surface-hover rounded-md transition-colors"
                  title="Add new space"
                >
                  <svg className="w-4 h-4 text-cognitive-tertiary hover:text-cognitive-primary" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div className="space-y-0.5 pb-2">
                {lists.map(list => (
                  <ListItem key={list.id} list={list} isActive={activeList === list.id} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Collapsible Stats Section */}
      <div className="border-t border-surface-200">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full p-3 flex items-center justify-between text-sm hover:bg-surface-50 transition-colors"
        >
          <span className="text-cognitive-secondary">Today's Progress</span>
          <div className="flex items-center gap-2">
            <span className="text-cognitive-primary font-medium">
              {todos.filter(t => t.completed).length}/{todos.length}
            </span>
            <svg 
              className={`w-4 h-4 text-cognitive-tertiary transition-transform ${
                showStats ? 'rotate-180' : ''
              }`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Expanded Stats Content */}
        {showStats && (
          <div className="p-3 bg-surface-50/50 animate-slideIn">
            <div className="space-y-3">
              <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-primary rounded-full transition-all duration-500"
                  style={{ 
                    width: `${todos.length ? (todos.filter(t => t.completed).length / todos.length) * 100 : 0}%` 
                  }}
                />
              </div>
              
              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white">
                  <div className="text-cognitive-tertiary">Completed Today</div>
                  <div className="text-cognitive-primary font-medium mt-1">
                    {todos.filter(t => t.completed && isToday(t.completedAt)).length}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white">
                  <div className="text-cognitive-tertiary">Remaining</div>
                  <div className="text-cognitive-primary font-medium mt-1">
                    {todos.filter(t => !t.completed).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Update ListItem component to be more compact
function ListItem({ list, isActive }) {
  const todoCount = useStore(state => 
    state.todos.filter(t => t.listId === list.id).length
  );

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg 
        transition-all duration-200 cursor-pointer
        ${isActive
          ? 'bg-surface-active text-cognitive-primary shadow-sm'
          : 'text-cognitive-secondary hover:bg-surface-hover'
        }`}
      onClick={() => useStore.setState({ activeList: list.id })}
    >
      <span className={`text-lg transition-transform ${
        isActive ? 'scale-105' : 'group-hover:scale-105'
      }`}>
        {list.icon}
      </span>

      <span className={`flex-1 truncate text-sm ${isActive ? 'font-medium' : ''}`}>
        {list.name}
      </span>

      <span className={`text-xs px-1.5 py-0.5 rounded-md transition-colors ${
        isActive
          ? 'bg-accent-primary/10 text-accent-primary'
          : 'bg-surface-100 text-cognitive-tertiary'
      }`}>
        {todoCount}
      </span>

      {!list.isDefault && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Are you sure you want to delete this space?')) {
              // ... existing delete logic ...
            }
          }}
          className={`absolute right-2 p-1 rounded-md opacity-0 group-hover:opacity-100
            transition-all hover:bg-red-50 text-cognitive-ghost hover:text-red-500`}
          title="Delete space"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Update the EmptyTasksAnimation component to accept setShowTodoForm as a prop
function EmptyTasksAnimation({ setShowTodoForm }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 -mt-8">
      <svg 
        className="w-56 h-56 mb-4" 
        viewBox="0 0 400 400" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glowing Background Circle */}
        <circle 
          cx="200" 
          cy="200" 
          r="160" 
          className="fill-accent-primary/5"
        >
          <animate
            attributeName="opacity"
            values="0.5;0.3;0.5"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Fox Body - More Defined Shape */}
        <g className="animate-float" style={{ animationDuration: '3s' }}>
          {/* Main Body */}
          <path 
            d="M140 190 
               C140 150 260 150 260 190
               C260 240 220 280 200 280
               C180 280 140 240 140 190"
            className="fill-[#ff9f43]"
          />

          {/* White Belly */}
          <path 
            d="M160 200
               C160 180 240 180 240 200
               C240 240 220 260 200 260
               C180 260 160 240 160 200"
            className="fill-white"
          />

          {/* Face - More Expressive */}
          <g transform="translate(0, -5)">
            {/* Eyes */}
            <g className="animate-pulse" style={{ animationDuration: '4s' }}>
              <circle cx="180" cy="195" r="5" className="fill-[#2d3436]" />
              <circle cx="220" cy="195" r="5" className="fill-[#2d3436]" />
              {/* Eye Shine */}
              <circle cx="182" cy="193" r="2" className="fill-white" />
              <circle cx="222" cy="193" r="2" className="fill-white" />
            </g>

            {/* Cute Nose */}
            <path 
              d="M198 205 Q200 207 202 205 L200 210 Z" 
              className="fill-[#2d3436]"
            />

            {/* Smiling Mouth */}
            <path 
              d="M190 215 Q200 225 210 215" 
              className="stroke-[#2d3436] fill-none"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <animate
                attributeName="d"
                values="M190 215 Q200 225 210 215;M190 220 Q200 230 210 220;M190 215 Q200 225 210 215"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Ears - More Dynamic */}
          <g className="origin-bottom">
            {/* Left Ear */}
            <path 
              d="M160 160 L140 120 L180 140 Z" 
              className="fill-[#ff9f43]"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-5 160 160;5 160 160;-5 160 160"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            {/* Right Ear */}
            <path 
              d="M240 160 L260 120 L220 140 Z" 
              className="fill-[#ff9f43]"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="5 240 160;-5 240 160;5 240 160"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Fluffy Tail */}
          <path 
            d="M260 200 Q290 180 300 200 Q310 220 290 230 Q270 240 260 220"
            className="fill-[#e17055]"
          >
            <animate
              attributeName="d"
              values="
                M260 200 Q290 180 300 200 Q310 220 290 230 Q270 240 260 220;
                M260 200 Q290 160 300 180 Q310 200 290 210 Q270 220 260 220;
                M260 200 Q290 180 300 200 Q310 220 290 230 Q270 240 260 220
              "
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Floating Task Papers with Cute Details */}
        <g className="animate-float" style={{ animationDuration: '4s' }}>
          {/* Task Paper 1 */}
          <g transform="rotate(-15, 120, 160)">
            <rect 
              x="100" 
              y="140" 
              width="40" 
              height="50" 
              rx="6" 
              className="fill-white stroke-accent-primary/30"
              strokeWidth="2"
            >
              <animate
                attributeName="y"
                values="140;130;140"
                dur="4s"
                repeatCount="indefinite"
              />
            </rect>
            {/* Cute Checkbox */}
            <rect 
              x="108" 
              y="150" 
              width="8" 
              height="8" 
              rx="2" 
              className="stroke-accent-primary/30"
              strokeWidth="2"
              fill="none"
            />
            {/* Task Lines */}
            <line x1="122" y1="154" x2="132" y2="154" className="stroke-accent-primary/30" strokeWidth="2" />
            <line x1="108" y1="165" x2="132" y2="165" className="stroke-accent-primary/30" strokeWidth="2" />
            <line x1="108" y1="175" x2="122" y2="175" className="stroke-accent-primary/30" strokeWidth="2" />
          </g>

          {/* Task Paper 2 */}
          <g transform="rotate(15, 280, 160)">
            <rect 
              x="260" 
              y="140" 
              width="40" 
              height="50" 
              rx="6" 
              className="fill-white stroke-accent-secondary/30"
              strokeWidth="2"
            >
              <animate
                attributeName="y"
                values="140;150;140"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </rect>
            {/* Cute Checkbox */}
            <rect 
              x="268" 
              y="150" 
              width="8" 
              height="8" 
              rx="2" 
              className="stroke-accent-secondary/30"
              strokeWidth="2"
              fill="none"
            />
            {/* Task Lines */}
            <line x1="282" y1="154" x2="292" y2="154" className="stroke-accent-secondary/30" strokeWidth="2" />
            <line x1="268" y1="165" x2="292" y2="165" className="stroke-accent-secondary/30" strokeWidth="2" />
            <line x1="268" y1="175" x2="282" y2="175" className="stroke-accent-secondary/30" strokeWidth="2" />
          </g>
        </g>

        {/* Sparkles and Stars */}
        <g className="animate-pulse">
          {/* Star 1 */}
          <path 
            d="M140 120 L143 127 L150 128 L145 133 L146 140 L140 137 L134 140 L135 133 L130 128 L137 127 Z" 
            className="fill-accent-primary/40"
          />
          {/* Star 2 */}
          <path 
            d="M260 120 L263 127 L270 128 L265 133 L266 140 L260 137 L254 140 L255 133 L250 128 L257 127 Z" 
            className="fill-accent-secondary/40"
          />
        </g>

        {/* Orbiting Elements */}
        <g>
          {/* Heart */}
          <path 
            d="M200 200 L205 195 Q210 190 205 185 T200 190 L195 185 Q190 190 195 195 Z" 
            className="fill-accent-primary"
          >
            <animateMotion
              path="M0 0 a60 60 0 1 0 120 0 a60 60 0 1 0 -120 0"
              dur="8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="1;0.5;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
          {/* Star */}
          <path 
            d="M200 200 L202 195 L207 195 L203 191 L204 186 L200 189 L196 186 L197 191 L193 195 L198 195 Z" 
            className="fill-accent-secondary"
          >
            <animateMotion
              path="M0 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>

      <h3 className="text-xl font-semibold text-cognitive-primary mb-2">
        Let's Get Organized! 🦊
      </h3>
      <p className="text-sm text-cognitive-secondary mb-6 max-w-md mx-auto">
        Your friendly task fox is ready to help you stay organized. Start by adding your first task!
      </p>

      <button
        onClick={() => setShowTodoForm(true)}
        className="px-5 py-2.5 bg-accent-primary text-white rounded-xl
          hover:bg-accent-primary/90 transition-all duration-300
          transform hover:scale-105 hover:shadow-natural-lg
          flex items-center gap-2 font-medium group"
      >
        <span className="relative">
          <svg className="w-4 h-4 transition-transform group-hover:rotate-180" 
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 4v16m8-8H4" />
          </svg>
        </span>
        Create Your First Task
      </button>

      {/* Quick Tips with Fox Theme */}
      <div className="mt-8 grid grid-cols-2 gap-3 max-w-lg mx-auto text-left">
        <div className="p-3 rounded-xl bg-surface-50 hover:bg-surface-100 
          transition-colors duration-200">
          <div className="flex items-start gap-2">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-medium text-cognitive-primary mb-0.5 text-sm">
                Fox's Wisdom
              </h4>
              <p className="text-xs text-cognitive-tertiary">
                Take one small step at a time, just like a clever fox
              </p>
            </div>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-surface-50 hover:bg-surface-100 
          transition-colors duration-200">
          <div className="flex items-start gap-2">
            <span className="text-xl">🎯</span>
            <div>
              <h4 className="font-medium text-cognitive-primary mb-0.5 text-sm">
                Set Priorities
              </h4>
              <p className="text-xs text-cognitive-tertiary">
                Focus on what matters most first
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this new component for swipeable todo items
function SwipeableTodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  // Set up drag gesture
  const bind = useDrag(({ down, movement: [mx], direction: [xDir], velocity: [vx], cancel }) => {
    const trigger = vx > 0.5 || Math.abs(mx) > 100;
    
    if (trigger && !down) {
      // Swipe right to complete
      if (mx > 0) {
        onToggle(todo.id);
        api.start({ x: 0 });
      }
      // Swipe left to delete
      if (mx < 0) {
        if (window.confirm('Are you sure you want to delete this task?')) {
          onDelete(todo.id);
        } else {
          api.start({ x: 0 });
        }
      }
    } else {
      api.start({ x: down ? mx : 0, immediate: down });
    }
  }, { axis: 'x' });

  return (
    <div className="relative touch-pan-y">
      {/* Background layers for swipe actions */}
      <div className="absolute inset-0 flex justify-between items-center px-4">
        <div className="flex items-center text-green-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="ml-2">Complete</span>
        </div>
        <div className="flex items-center text-red-500">
          <span className="mr-2">Delete</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      </div>
      
      {/* Swipeable todo item */}
      <animated.div
        {...bind()}
        style={{ x, touchAction: 'pan-y' }}
        className="relative bg-white rounded-xl shadow-natural-sm"
      >
        <TodoItem
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      </animated.div>
    </div>
  );
}

// Update the MobileDrawer component
function MobileDrawer({ isOpen, onClose, children }) {
  const [{ y }, api] = useSpring(() => ({ y: '100%' }));

  useEffect(() => {
    api.start({ y: isOpen ? '0%' : '100%' });
  }, [isOpen]);

  // Fix: Use different names for unused variables
  const bind = useDrag(({ down, movement: [_mx, my], velocity: [_vx, vy], cancel }) => {
    if (my > 200 || vy > 0.5) {
      onClose();
    } else {
      api.start({ y: down ? `${my}px` : '0%', immediate: down });
    }
  }, { axis: 'y', bounds: { top: 0 } });

  return (
    <animated.div
      {...bind()}
      style={{ y }}
      className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-natural-lg 
        touch-pan-y z-50 max-h-[90vh] overflow-y-auto"
    >
      <div className="w-12 h-1.5 bg-surface-200 rounded-full mx-auto my-3" />
      {children}
    </animated.div>
  );
}

export default App;
