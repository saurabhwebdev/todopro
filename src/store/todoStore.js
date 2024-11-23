import create from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const useStore = create(
  persist(
    (set, get) => ({
      lists: [{ id: 1, name: 'My Tasks', isDefault: true, icon: '📝' }],
      todos: [],
      activeList: 1,
      undoStack: [],
      redoStack: [],
      settings: {
        theme: 'light',
        showCompleted: true,
        sortBy: 'priority',
        viewMode: 'list',
      },
      statistics: {
        completedToday: 0,
        streak: 0,
        lastCompleted: null,
        completedTodayIds: [],
      },

      addList: (listData) => {
        set(state => ({
          lists: [...state.lists, {
            id: Date.now(),
            name: listData.name,
            icon: listData.icon,
            isDefault: listData.isDefault,
            isFavorite: listData.isFavorite
          }]
        }));
      },

      addTodo: (todo) => {
        const newTodo = {
          id: Date.now(),
          createdAt: new Date().toISOString(),
          completed: false,
          timeSpent: 0,
          subtasks: [],
          ...todo
        };
        set(state => ({ 
          todos: [...state.todos, newTodo],
          undoStack: [...state.undoStack, { action: 'add', todo: newTodo }]
        }));
      },

      toggleTodo: (id) => {
        set(state => {
          const todo = state.todos.find(t => t.id === id);
          const today = format(new Date(), 'yyyy-MM-dd');
          
          const currentStats = state.statistics || {
            completedToday: 0,
            streak: 0,
            lastCompleted: null,
            completedTodayIds: []
          };

          if (currentStats.lastCompleted !== today) {
            currentStats.completedToday = 0;
            currentStats.completedTodayIds = [];
          }

          if (todo?.completed === false) {
            const shouldCount = !currentStats.completedTodayIds?.includes(id);
            const lastCompleted = currentStats.lastCompleted;
            const isConsecutiveDay = lastCompleted === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
            
            return {
              todos: state.todos.map(t => 
                t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
              ),
              statistics: {
                ...currentStats,
                completedToday: shouldCount ? currentStats.completedToday + 1 : currentStats.completedToday,
                completedTodayIds: shouldCount ? [...(currentStats.completedTodayIds || []), id] : (currentStats.completedTodayIds || []),
                streak: isConsecutiveDay ? currentStats.streak + 1 : 1,
                lastCompleted: today
              }
            };
          }

          return {
            todos: state.todos.map(t =>
              t.id === id ? { ...t, completed: false, completedAt: null } : t
            ),
            statistics: {
              ...currentStats,
              lastCompleted: today
            }
          };
        });
      },

      updateTodo: (id, updates) => {
        set(state => ({
          todos: state.todos.map(todo =>
            todo.id === id ? { ...todo, ...updates } : todo
          )
        }));
      },

      deleteTodo: (id) => {
        set(state => {
          const todo = state.todos.find(t => t.id === id);
          return {
            todos: state.todos.filter(t => t.id !== id),
            undoStack: [...state.undoStack, { action: 'delete', todo }]
          };
        });
      },

      undo: () => {
        const { undoStack } = get();
        if (undoStack.length === 0) return;

        const lastAction = undoStack[undoStack.length - 1];
        set(state => {
          if (lastAction.action === 'add') {
            return {
              todos: state.todos.filter(t => t.id !== lastAction.todo.id),
              undoStack: state.undoStack.slice(0, -1),
              redoStack: [...state.redoStack, lastAction]
            };
          } else if (lastAction.action === 'delete') {
            return {
              todos: [...state.todos, lastAction.todo],
              undoStack: state.undoStack.slice(0, -1),
              redoStack: [...state.redoStack, lastAction]
            };
          }
          return state;
        });
      },

      redo: () => {
        const { redoStack } = get();
        if (redoStack.length === 0) return;

        const lastAction = redoStack[redoStack.length - 1];
        set(state => {
          if (lastAction.action === 'add') {
            return {
              todos: [...state.todos, lastAction.todo],
              redoStack: state.redoStack.slice(0, -1),
              undoStack: [...state.undoStack, lastAction]
            };
          } else if (lastAction.action === 'delete') {
            return {
              todos: state.todos.filter(t => t.id !== lastAction.todo.id),
              redoStack: state.redoStack.slice(0, -1),
              undoStack: [...state.undoStack, lastAction]
            };
          }
          return state;
        });
      },

      updateSettings: (settings) => {
        set(state => ({
          settings: { ...state.settings, ...settings }
        }));
      },
    }),
    {
      name: 'todo-storage',
    }
  )
);

export default useStore; 