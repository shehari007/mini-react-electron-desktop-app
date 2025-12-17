import React, { useState, useEffect } from 'react';
import { Input, Button, Checkbox, Empty } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ClearOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

// Storage helper
const storage = {
  get: (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }
};

function ToDoList() {
  const [tasks, setTasks] = useState(() => storage.get('todos', []));
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, completed

  // Save to storage whenever tasks change
  useEffect(() => {
    storage.set('todos', tasks);
  }, [tasks]);

  const addTask = () => {
    if (newTask.trim() === '') return;
    
    const task = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    setTasks(prev => [task, ...prev]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks(prev => prev.filter(task => !task.completed));
  };

  const clearAll = () => {
    setTasks([]);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = tasks.length - completedCount;

  return (
    <div style={{ width: '100%' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: '20px',
        padding: '32px',
        color: 'white',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>
          📝 My Tasks
        </h2>
        <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
          {activeCount === 0 
            ? "You're all caught up! 🎉" 
            : `You have ${activeCount} task${activeCount !== 1 ? 's' : ''} remaining`
          }
        </p>
        
        {/* Stats */}
        <div style={{ 
          display: 'flex', 
          gap: '24px', 
          marginTop: '20px'
        }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.15)', 
            padding: '12px 20px', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{tasks.length}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Total</div>
          </div>
          <div style={{ 
            background: 'rgba(255,255,255,0.15)', 
            padding: '12px 20px', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{activeCount}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Active</div>
          </div>
          <div style={{ 
            background: 'rgba(255,255,255,0.15)', 
            padding: '12px 20px', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{completedCount}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Done</div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Input
            placeholder="What needs to be done?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onPressEnter={addTask}
            size="large"
            style={{ flex: 1, minWidth: '220px' }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={addTask}
            size="large"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Filter & Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'active', 'completed'].map(f => (
            <Button
              key={f}
              type={filter === f ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilter(f)}
              style={{ textTransform: 'capitalize' }}
            >
              {f}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {completedCount > 0 && (
            <Button 
              size="small" 
              onClick={clearCompleted}
              icon={<CheckCircleOutlined />}
            >
              Clear Done
            </Button>
          )}
          {tasks.length > 0 && (
            <Button 
              size="small" 
              danger 
              onClick={clearAll}
              icon={<ClearOutlined />}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}>
        {filteredTasks.length === 0 ? (
          <div style={{ padding: '48px 24px' }}>
            <Empty 
              description={
                filter === 'all' 
                  ? "No tasks yet. Add one above!" 
                  : `No ${filter} tasks`
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div>
            {filteredTasks.map((task, index) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: index < filteredTasks.length - 1 ? '1px solid #f0f0f0' : 'none',
                  background: task.completed ? '#fafafa' : 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                <Checkbox
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  style={{ marginRight: '16px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '15px',
                    color: task.completed ? '#9ca3af' : '#1f2937',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                    {task.text}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9ca3af',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ClockCircleOutlined />
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteTask(task.id)}
                  style={{ opacity: 0.6 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ToDoList;
