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
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  
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
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      notes: notes.trim(),
    });
    setInput('');
    setTodoPriority('medium');
    setDueDate('');
    setNotes('');
    setShowTodoForm(false);
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

      {/* Task Form Modal - Moved outside the header */}
      {showTodoForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 
          z-[99999] overflow-y-auto" onClick={() => setShowTodoForm(false)}>
          <div className="relative my-auto w-full max-w-md bg-white rounded-2xl shadow-xl animate-slideIn 
            transform transition-all" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleAddTodo} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-cognitive-primary">Create New Task</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowTodoForm(false);
                    setInput('');
                    setDueDate('');
                    setNotes('');
                    setTodoPriority('medium');
                  }}
                  className="p-2 hover:bg-surface-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-cognitive-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cognitive-secondary">
                    What needs to be done?
                  </label>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter task name..."
                    className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl
                      focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                    autoFocus
                  />
                </div>

                {/* Due Date Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cognitive-secondary">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl
                      focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                  />
                </div>

                {/* Priority Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cognitive-secondary">
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTodoPriority('low')}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium
                        transition-all duration-200 ${
                        todoPriority === 'low'
                          ? 'bg-emerald-500 text-white border-emerald-500' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                        }`}
                      >
                        Low
                      </button>
                    <button
                      type="button"
                      onClick={() => setTodoPriority('medium')}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium
                        transition-all duration-200 ${
                        todoPriority === 'medium'
                          ? 'bg-amber-500 text-white border-amber-500' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                        }`}
                      >
                        Medium
                      </button>
                    <button
                      type="button"
                      onClick={() => setTodoPriority('high')}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium
                        transition-all duration-200 ${
                        todoPriority === 'high'
                          ? 'bg-rose-500 text-white border-rose-500' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                        }`}
                      >
                        High
                      </button>
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cognitive-secondary">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                    className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl
                      focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
                      resize-none"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTodoForm(false);
                      setInput('');
                      setDueDate('');
                      setNotes('');
                      setTodoPriority('medium');
                    }}
                    className="px-4 py-2 text-cognitive-secondary hover:bg-surface-hover rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!input.trim()}
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Actions */}
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
          <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Main Face Shape */}
            <path 
              d="M10 22C10 14 38 14 38 22C38 32 28 38 24 38C20 38 10 32 10 22Z" 
              className="fill-[#ff9f43]"
            />
            
            {/* White Face Patch */}
            <path 
              d="M14 23C14 19 34 19 34 23C34 30 28 34 24 34C20 34 14 30 14 23Z" 
              fill="white"
            />
            
            {/* Eyes */}
            <circle cx="19" cy="24" r="2" fill="#2d3436" />
            <circle cx="29" cy="24" r="2" fill="#2d3436" />
            <circle cx="19.5" cy="23.5" r="0.5" fill="white" />
            <circle cx="29.5" cy="23.5" r="0.5" fill="white" />
            
            {/* Nose */}
            <path 
              d="M23.5 26.5L24 27L24.5 26.5" 
              stroke="#2d3436" 
              strokeWidth="0.5" 
              strokeLinecap="round"
            />
            
            {/* Ears */}
            <path 
              d="M14 20L10 12L18 16Z" 
              className="fill-[#ff9f43]"
            />
            <path 
              d="M34 20L38 12L30 16Z" 
              className="fill-[#ff9f43]"
            />
            
            {/* Inner Ears */}
            <path 
              d="M14.5 18L12.5 14L16.5 16Z" 
              className="fill-[#e17055]"
            />
            <path 
              d="M33.5 18L35.5 14L31.5 16Z" 
              className="fill-[#e17055]"
            />
            
            {/* Cheeks */}
            <circle cx="17" cy="26" r="1.5" className="fill-[#ffaa5b] opacity-40" />
            <circle cx="31" cy="26" r="1.5" className="fill-[#ffaa5b] opacity-40" />
          </svg>

          <h1 className="text-xl font-bold bg-gradient-to-r from-[#ff9f43] to-[#e17055]
            bg-clip-text text-transparent">
            FoxTasks
          </h1>
        </div>
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
        className="w-64 h-64 mb-4" 
        viewBox="0 0 400 400" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Animated Background Circle with Gradient */}
        <defs>
          <radialGradient id="taskGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        <circle 
          cx="200" 
          cy="200" 
          r="160" 
          fill="url(#taskGlow)"
        >
          <animate
            attributeName="r"
            values="160;165;160"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Floating Fox Character */}
        <g className="origin-center">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -10; 0 0"
            dur="3s"
            repeatCount="indefinite"
          />

          {/* Fox Body */}
          <path 
            d="M160 200
               C160 160 240 160 240 200
               C240 240 210 260 200 260
               C190 260 160 240 160 200"
            className="fill-[#ff9f43]"
          >
            <animate
              attributeName="d"
              values="
                M160 200 C160 160 240 160 240 200 C240 240 210 260 200 260 C190 260 160 240 160 200;
                M165 200 C165 165 235 165 235 200 C235 235 210 255 200 255 C190 255 165 235 165 200;
                M160 200 C160 160 240 160 240 200 C240 240 210 260 200 260 C190 260 160 240 160 200
              "
              dur="3s"
              repeatCount="indefinite"
            />
          </path>

          {/* White Belly */}
          <path 
            d="M170 205
               C170 185 230 185 230 205
               C230 235 210 245 200 245
               C190 245 170 235 170 205"
            fill="white"
          />

          {/* Eyes with Blinking Animation */}
          <g>
            {/* Left Eye */}
            <circle cx="185" cy="200" r="4" fill="#2d3436">
              <animate
                attributeName="ry"
                values="4;0.5;4"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Right Eye */}
            <circle cx="215" cy="200" r="4" fill="#2d3436">
              <animate
                attributeName="ry"
                values="4;0.5;4"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Eye Shine */}
            <circle cx="187" cy="198" r="1.5" fill="white" />
            <circle cx="217" cy="198" r="1.5" fill="white" />
          </g>

          {/* Animated Tail */}
          <path 
            d="M240 210 Q270 190 280 210 Q290 230 270 240 Q250 250 240 230"
            className="fill-[#e17055]"
          >
            <animate
              attributeName="d"
              values="
                M240 210 Q270 190 280 210 Q290 230 270 240 Q250 250 240 230;
                M240 210 Q270 170 280 190 Q290 210 270 220 Q250 230 240 230;
                M240 210 Q270 190 280 210 Q290 230 270 240 Q250 250 240 230
              "
              dur="2s"
              repeatCount="indefinite"
            />
          </path>

          {/* Ears with Wiggle Animation */}
          <g>
            {/* Left Ear */}
            <path 
              d="M170 170 L150 130 L190 150 Z" 
              className="fill-[#ff9f43]"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-5 170 170;5 170 170;-5 170 170"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            {/* Right Ear */}
            <path 
              d="M230 170 L250 130 L210 150 Z" 
              className="fill-[#ff9f43]"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="5 230 170;-5 230 170;5 230 170"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        </g>

        {/* Floating Task Papers with Checkmarks */}
        <g>
          {/* Left Paper */}
          <g transform="translate(-20, 0)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="-20 0;-20 -15;-20 0"
              dur="4s"
              repeatCount="indefinite"
            />
            <rect 
              x="120" 
              y="150" 
              width="60" 
              height="80" 
              rx="8" 
              className="fill-white stroke-accent-primary/30"
              strokeWidth="2"
            />
            <circle cx="140" cy="170" r="4" className="fill-accent-primary/20" />
            <line x1="155" y1="170" x2="165" y2="170" className="stroke-accent-primary/30" strokeWidth="2" />
            <line x1="140" y1="190" x2="165" y2="190" className="stroke-accent-primary/30" strokeWidth="2" />
            <line x1="140" y1="210" x2="160" y2="210" className="stroke-accent-primary/30" strokeWidth="2" />
          </g>

          {/* Right Paper */}
          <g transform="translate(20, 0)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="20 -10;20 5;20 -10"
              dur="3.5s"
              repeatCount="indefinite"
            />
            <rect 
              x="220" 
              y="150" 
              width="60" 
              height="80" 
              rx="8" 
              className="fill-white stroke-accent-secondary/30"
              strokeWidth="2"
            />
            <circle cx="240" cy="170" r="4" className="fill-accent-secondary/20" />
            <line x1="255" y1="170" x2="265" y2="170" className="stroke-accent-secondary/30" strokeWidth="2" />
            <line x1="240" y1="190" x2="265" y2="190" className="stroke-accent-secondary/30" strokeWidth="2" />
            <line x1="240" y1="210" x2="260" y2="210" className="stroke-accent-secondary/30" strokeWidth="2" />
          </g>
        </g>

        {/* Sparkles */}
        <g className="animate-pulse">
          {[
            { x: 140, y: 130, delay: "0s" },
            { x: 260, y: 130, delay: "0.5s" },
            { x: 200, y: 280, delay: "1s" }
          ].map((spark, i) => (
            <g key={i} style={{ animationDelay: spark.delay }}>
              <path 
                d={`M${spark.x} ${spark.y} l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z`}
                className="fill-accent-primary/40"
              >
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  dur="2s"
                  begin={spark.delay}
                  repeatCount="indefinite"
                />
              </path>
            </g>
          ))}
        </g>

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <circle
            key={i}
            cx={150 + i * 20}
            cy={150 + i * 10}
            r="2"
            className="fill-accent-primary/30"
          >
            <animate
              attributeName="cy"
              values={`${150 + i * 10};${140 + i * 10};${150 + i * 10}`}
              dur={`${2 + i * 0.5}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur={`${2 + i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>

      <h3 className="text-xl font-semibold text-cognitive-primary mb-2">
        Let's Get Started! 🦊
      </h3>
      <p className="text-sm text-cognitive-secondary mb-6 max-w-md text-center">
        Your task list is empty. Add your first task and let's get productive together!
      </p>

      <button
        onClick={() => setShowTodoForm(true)}
        className="px-6 py-3 bg-accent-primary text-white rounded-xl
          hover:bg-accent-primary/90 transition-all duration-300
          transform hover:scale-105 hover:shadow-natural-lg
          flex items-center gap-2 font-medium group"
      >
        <svg className="w-5 h-5 transition-transform group-hover:rotate-180" 
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 4v16m8-8H4" />
        </svg>
        Create Your First Task
      </button>

      {/* Quick Tips */}
      <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <div className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 
          transition-colors duration-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡️</span>
            <div>
              <h4 className="font-medium text-cognitive-primary mb-1">
                Quick Add
              </h4>
              <p className="text-xs text-cognitive-tertiary">
                Press Ctrl+N to quickly add new tasks
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 
          transition-colors duration-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <h4 className="font-medium text-cognitive-primary mb-1">
                Stay Focused
              </h4>
              <p className="text-xs text-cognitive-tertiary">
                Break down big tasks into smaller ones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-80 flex flex-col h-full bg-white border-r border-surface-200">
      {/* Branding Section - Compact */}
      <div className="px-4 py-3 border-b border-surface-200">
        <div className="flex items-center gap-3">
          {/* Fox Icon - Larger without container */}
          <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Main Face Shape */}
            <path 
              d="M10 22C10 14 38 14 38 22C38 32 28 38 24 38C20 38 10 32 10 22Z" 
              className="fill-[#ff9f43]"
            />
            
            {/* White Face Patch */}
            <path 
              d="M14 23C14 19 34 19 34 23C34 30 28 34 24 34C20 34 14 30 14 23Z" 
              fill="white"
            />
            
            {/* Eyes */}
            <circle cx="19" cy="24" r="2" fill="#2d3436" />
            <circle cx="29" cy="24" r="2" fill="#2d3436" />
            <circle cx="19.5" cy="23.5" r="0.5" fill="white" />
            <circle cx="29.5" cy="23.5" r="0.5" fill="white" />
            
            {/* Nose */}
            <path 
              d="M23.5 26.5L24 27L24.5 26.5" 
              stroke="#2d3436" 
              strokeWidth="0.5" 
              strokeLinecap="round"
            />
            
            {/* Ears */}
            <path 
              d="M14 20L10 12L18 16Z" 
              className="fill-[#ff9f43]"
            />
            <path 
              d="M34 20L38 12L30 16Z" 
              className="fill-[#ff9f43]"
            />
            
            {/* Inner Ears */}
            <path 
              d="M14.5 18L12.5 14L16.5 16Z" 
              className="fill-[#e17055]"
            />
            <path 
              d="M33.5 18L35.5 14L31.5 16Z" 
              className="fill-[#e17055]"
            />
            
            {/* Cheeks */}
            <circle cx="17" cy="26" r="1.5" className="fill-[#ffaa5b] opacity-40" />
            <circle cx="31" cy="26" r="1.5" className="fill-[#ffaa5b] opacity-40" />
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

// Replace the existing EmptyTasksAnimation component with this enhanced version
function EmptyTasksAnimation({ setShowTodoForm }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 -mt-8">
      <svg 
        className="w-64 h-64 mb-4" 
        viewBox="0 0 400 400" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Animated Background Circle with Gradient */}
        <defs>
          <radialGradient id="taskGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        <circle 
          cx="200" 
          cy="200" 
          r="160" 
          fill="url(#taskGlow)"
        >
          <animate
            attributeName="r"
            values="160;165;160"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Floating Fox Character */}
        <g className="origin-center">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -10; 0 0"
            dur="3s"
            repeatCount="indefinite"
          />

          {/* Fox Body */}
          <path 
            d="M160 200
               C160 160 240 160 240 200
               C240 240 210 260 200 260
               C190 260 160 240 160 200"
            className="fill-[#ff9f43]"
          >
            <animate
              attributeName="d"
              values="
                M160 200 C160 160 240 160 240 200 C240 240 210 260 200 260 C190 260 160 240 160 200;
                M165 200 C165 165 235 165 235 200 C235 235 210 255 200 255 C190 255 165 235 165 200;
                M160 200 C160 160 240 160 240 200 C240 240 210 260 200 260 C190 260 160 240 160 200
              "
              dur="3s"
              repeatCount="indefinite"
            />
          </path>

          {/* White Belly */}
          <path 
            d="M170 205
               C170 185 230 185 230 205
               C230 235 210 245 200 245
               C190 245 170 235 170 205"
            fill="white"
          />

          {/* Eyes with Blinking Animation */}
          <g>
            {/* Left Eye */}
            <circle cx="185" cy="200" r="4" fill="#2d3436">
              <animate
                attributeName="ry"
                values="4;0.5;4"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Right Eye */}
            <circle cx="215" cy="200" r="4" fill="#2d3436">
              <animate
                attributeName="ry"
                values="4;0.5;4"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Eye Shine */}
            <circle cx="187" cy="198" r="1.5" fill="white" />
            <circle cx="217" cy="198" r="1.5" fill="white" />
          </g>

          {/* Animated Tail */}
          <path 
            d="M240 210 Q270 190 280 210 Q290 230 270 240 Q250 250 240 230"
            className="fill-[#e17055]"
          >
            <animate
              attributeName="d"
              values="
                M240 210 Q270 190 280 210 Q290 230 270 240 Q250 250 240 230;
                M240 210 Q270 170 280 190 Q290 210 270 220 Q250 230 240 230;
                M240 210 Q270 190 280 210 Q290 230 270 240 Q250 250 240 230
              "
              dur="2s"
              repeatCount="indefinite"
            />
          </path>

          {/* Ears with Wiggle Animation */}
          <g>
            {/* Left Ear */}
            <path 
              d="M170 170 L150 130 L190 150 Z" 
              className="fill-[#ff9f43]"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-5 170 170;5 170 170;-5 170 170"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            {/* Right Ear */}
            <path 
              d="M230 170 L250 130 L210 150 Z" 
              className="fill-[#ff9f43]"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="5 230 170;-5 230 170;5 230 170"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        </g>

        {/* Floating Task Papers with Checkmarks */}
        <g>
          {/* Left Paper */}
          <g transform="translate(-20, 0)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="-20 0;-20 -15;-20 0"
              dur="4s"
              repeatCount="indefinite"
            />
            <rect 
              x="120" 
              y="150" 
              width="60" 
              height="80" 
              rx="8" 
              className="fill-white stroke-accent-primary/30"
              strokeWidth="2"
            />
            <circle cx="140" cy="170" r="4" className="fill-accent-primary/20" />
            <line x1="155" y1="170" x2="165" y2="170" className="stroke-accent-primary/30" strokeWidth="2" />
            <line x1="140" y1="190" x2="165" y2="190" className="stroke-accent-primary/30" strokeWidth="2" />
            <line x1="140" y1="210" x2="160" y2="210" className="stroke-accent-primary/30" strokeWidth="2" />
          </g>

          {/* Right Paper */}
          <g transform="translate(20, 0)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="20 -10;20 5;20 -10"
              dur="3.5s"
              repeatCount="indefinite"
            />
            <rect 
              x="220" 
              y="150" 
              width="60" 
              height="80" 
              rx="8" 
              className="fill-white stroke-accent-secondary/30"
              strokeWidth="2"
            />
            <circle cx="240" cy="170" r="4" className="fill-accent-secondary/20" />
            <line x1="255" y1="170" x2="265" y2="170" className="stroke-accent-secondary/30" strokeWidth="2" />
            <line x1="240" y1="190" x2="265" y2="190" className="stroke-accent-secondary/30" strokeWidth="2" />
            <line x1="240" y1="210" x2="260" y2="210" className="stroke-accent-secondary/30" strokeWidth="2" />
          </g>
        </g>

        {/* Sparkles */}
        <g className="animate-pulse">
          {[
            { x: 140, y: 130, delay: "0s" },
            { x: 260, y: 130, delay: "0.5s" },
            { x: 200, y: 280, delay: "1s" }
          ].map((spark, i) => (
            <g key={i} style={{ animationDelay: spark.delay }}>
              <path 
                d={`M${spark.x} ${spark.y} l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z`}
                className="fill-accent-primary/40"
              >
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  dur="2s"
                  begin={spark.delay}
                  repeatCount="indefinite"
                />
              </path>
            </g>
          ))}
        </g>

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <circle
            key={i}
            cx={150 + i * 20}
            cy={150 + i * 10}
            r="2"
            className="fill-accent-primary/30"
          >
            <animate
              attributeName="cy"
              values={`${150 + i * 10};${140 + i * 10};${150 + i * 10}`}
              dur={`${2 + i * 0.5}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur={`${2 + i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>

      <h3 className="text-xl font-semibold text-cognitive-primary mb-2">
        Let's Get Started! 🦊
      </h3>
      <p className="text-sm text-cognitive-secondary mb-6 max-w-md text-center">
        Your task list is empty. Add your first task and let's get productive together!
      </p>

      <button
        onClick={() => setShowTodoForm(true)}
        className="px-6 py-3 bg-accent-primary text-white rounded-xl
          hover:bg-accent-primary/90 transition-all duration-300
          transform hover:scale-105 hover:shadow-natural-lg
          flex items-center gap-2 font-medium group"
      >
        <svg className="w-5 h-5 transition-transform group-hover:rotate-180" 
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 4v16m8-8H4" />
        </svg>
        Create Your First Task
      </button>

      {/* Quick Tips */}
      <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <div className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 
          transition-colors duration-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡️</span>
            <div>
              <h4 className="font-medium text-cognitive-primary mb-1">
                Quick Add
              </h4>
              <p className="text-xs text-cognitive-tertiary">
                Press Ctrl+N to quickly add new tasks
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 
          transition-colors duration-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <h4 className="font-medium text-cognitive-primary mb-1">
                Stay Focused
              </h4>
              <p className="text-xs text-cognitive-tertiary">
                Break down big tasks into smaller ones
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
