import React, { useState, useEffect, useRef } from 'react';
import { Button, Tabs, Tooltip } from 'antd';
import { DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import * as math from 'mathjs';

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

// Basic Calculator Component
const BasicCalculator = ({ onAddHistory }) => {
  const [input, setInput] = useState('0');
  const [expression, setExpression] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleButtonClick = (value) => {
    if (value === 'Escape') {
      setInput('0');
      setExpression('');
    } else if (value === 'Backspace') {
      setInput(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (value === '±') {
      setInput(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
    } else {
      setInput(prev => prev === '0' && value !== '.' ? value : prev + value);
    }
  };

  const handleKeyPress = (event) => {
    const key = event.key;
    const validKeys = '0123456789+-*/.%^()';
    if (validKeys.includes(key)) {
      event.preventDefault();
      handleButtonClick(key);
    } else if (key === 'Enter') {
      event.preventDefault();
      calculateResult();
    } else if (key === 'Escape') {
      event.preventDefault();
      handleButtonClick('Escape');
    } else if (key === 'Backspace') {
      event.preventDefault();
      handleButtonClick('Backspace');
    }
  };

  const calculateResult = () => {
    try {
      let expr = input;
      if (input.includes('%')) {
        expr = input.replace(/%/g, '/100*');
      }
      const result = math.evaluate(expr);
      const historyEntry = { expression: input, result: String(result), timestamp: Date.now() };
      onAddHistory(historyEntry);
      setExpression(input + ' =');
      setInput(String(result));
    } catch (error) {
      setInput('Error');
      setExpression('');
    }
  };

  const buttons = [
    { label: 'C', value: 'Escape', className: 'calc-btn-clear' },
    { label: '(', value: '(', className: 'calc-btn-operator' },
    { label: ')', value: ')', className: 'calc-btn-operator' },
    { label: '÷', value: '/', className: 'calc-btn-operator' },
    { label: '7', value: '7', className: 'calc-btn-number' },
    { label: '8', value: '8', className: 'calc-btn-number' },
    { label: '9', value: '9', className: 'calc-btn-number' },
    { label: '×', value: '*', className: 'calc-btn-operator' },
    { label: '4', value: '4', className: 'calc-btn-number' },
    { label: '5', value: '5', className: 'calc-btn-number' },
    { label: '6', value: '6', className: 'calc-btn-number' },
    { label: '−', value: '-', className: 'calc-btn-operator' },
    { label: '1', value: '1', className: 'calc-btn-number' },
    { label: '2', value: '2', className: 'calc-btn-number' },
    { label: '3', value: '3', className: 'calc-btn-number' },
    { label: '+', value: '+', className: 'calc-btn-operator' },
    { label: '±', value: '±', className: 'calc-btn-operator' },
    { label: '0', value: '0', className: 'calc-btn-number' },
    { label: '.', value: '.', className: 'calc-btn-number' },
    { label: '=', value: '=', className: 'calc-btn-equal' },
  ];

  return (
    <div className="calculator-card">
      <div className="calculator-display">
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', minHeight: '20px', marginBottom: '8px' }}>
          {expression}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onKeyDown={handleKeyPress}
          readOnly
          style={{
            width: '100%', background: 'transparent', border: 'none', color: 'white',
            fontSize: '42px', fontWeight: '300', textAlign: 'right', outline: 'none',
            fontFamily: "'Inter', monospace"
          }}
        />
      </div>
      <div className="calculator-buttons">
        {buttons.map((btn, index) => (
          <Button
            key={index}
            className={btn.className}
            onClick={() => btn.value === '=' ? calculateResult() : handleButtonClick(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Scientific Calculator Component
const ScientificCalculator = ({ onAddHistory }) => {
  const [input, setInput] = useState('0');
  const [expression, setExpression] = useState('');
  const [isDegree, setIsDegree] = useState(true);
  const [memory, setMemory] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const toRadians = (deg) => deg * (Math.PI / 180);
  const toDegrees = (rad) => rad * (180 / Math.PI);

  const handleButtonClick = (value) => {
    if (value === 'Escape') {
      setInput('0');
      setExpression('');
    } else if (value === 'Backspace') {
      setInput(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      setInput(prev => prev === '0' && value !== '.' ? value : prev + value);
    }
  };

  const handleScientific = (func) => {
    try {
      const num = parseFloat(input);
      let result;
      
      switch (func) {
        case 'sin': result = isDegree ? Math.sin(toRadians(num)) : Math.sin(num); break;
        case 'cos': result = isDegree ? Math.cos(toRadians(num)) : Math.cos(num); break;
        case 'tan': result = isDegree ? Math.tan(toRadians(num)) : Math.tan(num); break;
        case 'asin': result = isDegree ? toDegrees(Math.asin(num)) : Math.asin(num); break;
        case 'acos': result = isDegree ? toDegrees(Math.acos(num)) : Math.acos(num); break;
        case 'atan': result = isDegree ? toDegrees(Math.atan(num)) : Math.atan(num); break;
        case 'sqrt': result = Math.sqrt(num); break;
        case 'cbrt': result = Math.cbrt(num); break;
        case 'square': result = num * num; break;
        case 'cube': result = num * num * num; break;
        case 'log': result = Math.log10(num); break;
        case 'ln': result = Math.log(num); break;
        case 'exp': result = Math.exp(num); break;
        case '10x': result = Math.pow(10, num); break;
        case 'inv': result = 1 / num; break;
        case 'abs': result = Math.abs(num); break;
        case 'fact': result = factorial(num); break;
        case 'pi': result = Math.PI; setInput(String(result)); return;
        case 'e': result = Math.E; setInput(String(result)); return;
        case 'MC': setMemory(0); return;
        case 'MR': setInput(String(memory)); return;
        case 'M+': setMemory(memory + num); return;
        case 'M-': setMemory(memory - num); return;
        default: return;
      }
      
      const historyEntry = { expression: `${func}(${input})`, result: String(result), timestamp: Date.now() };
      onAddHistory(historyEntry);
      setExpression(`${func}(${input}) =`);
      setInput(String(result));
    } catch (error) {
      setInput('Error');
    }
  };

  const factorial = (n) => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  };

  const calculateResult = () => {
    try {
      const result = math.evaluate(input);
      const historyEntry = { expression: input, result: String(result), timestamp: Date.now() };
      onAddHistory(historyEntry);
      setExpression(input + ' =');
      setInput(String(result));
    } catch (error) {
      setInput('Error');
    }
  };

  const scientificBtns = [
    { label: 'MC', func: 'MC' }, { label: 'MR', func: 'MR' }, { label: 'M+', func: 'M+' }, { label: 'M-', func: 'M-' },
    { label: 'sin', func: 'sin' }, { label: 'cos', func: 'cos' }, { label: 'tan', func: 'tan' }, { label: 'π', func: 'pi' },
    { label: 'sin⁻¹', func: 'asin' }, { label: 'cos⁻¹', func: 'acos' }, { label: 'tan⁻¹', func: 'atan' }, { label: 'e', func: 'e' },
    { label: '√', func: 'sqrt' }, { label: '∛', func: 'cbrt' }, { label: 'x²', func: 'square' }, { label: 'x³', func: 'cube' },
    { label: 'log', func: 'log' }, { label: 'ln', func: 'ln' }, { label: 'eˣ', func: 'exp' }, { label: '10ˣ', func: '10x' },
    { label: '1/x', func: 'inv' }, { label: '|x|', func: 'abs' }, { label: 'n!', func: 'fact' }, { label: isDegree ? 'DEG' : 'RAD', func: 'toggle' },
  ];

  const basicBtns = [
    { label: 'C', value: 'Escape', className: 'calc-btn-clear' },
    { label: '(', value: '(' }, { label: ')', value: ')' }, { label: '÷', value: '/' },
    { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }, { label: '×', value: '*' },
    { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '−', value: '-' },
    { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '+', value: '+' },
    { label: '^', value: '^' }, { label: '0', value: '0' }, { label: '.', value: '.' }, { label: '=', value: '=' },
  ];

  return (
    <div className="calculator-card">
      <div className="calculator-display">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {memory !== 0 && `M: ${memory}`}
          </span>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{expression}</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          readOnly
          style={{
            width: '100%', background: 'transparent', border: 'none', color: 'white',
            fontSize: '36px', fontWeight: '300', textAlign: 'right', outline: 'none',
            fontFamily: "'Inter', monospace"
          }}
        />
      </div>
      
      {/* Scientific Buttons */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px',
        padding: '12px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0'
      }}>
        {scientificBtns.map((btn, i) => (
          <Tooltip key={i} title={btn.func}>
            <Button
              size="small"
              style={{ fontSize: '12px', height: '36px', background: btn.func === 'toggle' ? (isDegree ? '#dbeafe' : '#fef3c7') : '#e0e7ff', color: '#4338ca', border: 'none' }}
              onClick={() => btn.func === 'toggle' ? setIsDegree(!isDegree) : handleScientific(btn.func)}
            >
              {btn.label}
            </Button>
          </Tooltip>
        ))}
      </div>

      {/* Basic Buttons */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
        padding: '12px', background: '#f8fafc'
      }}>
        {basicBtns.map((btn, i) => (
          <Button
            key={i}
            className={btn.className || (btn.value === '=' ? 'calc-btn-equal' : ['/', '*', '-', '+', '^', '(', ')'].includes(btn.value) ? 'calc-btn-operator' : 'calc-btn-number')}
            style={{ height: '48px', fontSize: '18px' }}
            onClick={() => btn.value === '=' ? calculateResult() : handleButtonClick(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

// History Panel Component
const HistoryPanel = ({ history, onClear, onUseResult }) => (
  <div style={{
    background: 'white', borderRadius: '16px', padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)', height: '100%'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <HistoryOutlined /> History
      </h4>
      {history.length > 0 && (
        <Button size="small" icon={<DeleteOutlined />} onClick={onClear}>Clear</Button>
      )}
    </div>
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
          No calculations yet
        </div>
      ) : (
        history.slice().reverse().map((item, i) => (
          <div
            key={i}
            onClick={() => onUseResult(item.result)}
            style={{
              padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '14px', color: '#6b7280' }}>{item.expression}</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>= {item.result}</div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Main Calculator Component
function Calculator() {
  const [history, setHistory] = useState(() => storage.get('calcHistory', []));
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    storage.set('calcHistory', history);
  }, [history]);

  const addHistory = (entry) => {
    setHistory(prev => [...prev, entry].slice(-50)); // Keep last 50
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const tabItems = [
    { key: 'basic', label: '🔢 Basic', children: <BasicCalculator onAddHistory={addHistory} /> },
    { key: 'scientific', label: '🔬 Scientific', children: <ScientificCalculator onAddHistory={addHistory} /> },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div className="calculator-layout">
        {/* Calculator */}
        <div>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          />
          <div style={{
            marginTop: '16px', padding: '12px 16px', background: 'white', borderRadius: '12px',
            fontSize: '13px', color: '#6b7280', textAlign: 'center'
          }}>
            💡 Keyboard: <strong>Enter</strong> = Calculate • <strong>Esc</strong> = Clear
          </div>
        </div>

        {/* History */}
        <HistoryPanel history={history} onClear={clearHistory} onUseResult={() => {}} />
      </div>
    </div>
  );
}

export default Calculator;
