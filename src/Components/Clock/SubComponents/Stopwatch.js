import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, FlagOutlined } from '@ant-design/icons';

function Stopwatch() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [laps, setLaps] = useState([]);

  useEffect(() => {
    let intervalId;

    if (isActive) {
      intervalId = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 10);
      }, 10);
    }

    return () => clearInterval(intervalId);
  }, [isActive]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const addLap = () => {
    setLaps(prev => [elapsedTime, ...prev]);
  };

  const reset = () => {
    setIsActive(false);
    setElapsedTime(0);
    setLaps([]);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
        ⏱️ Stopwatch
      </div>
      
      {/* Display */}
      <div style={{
        fontSize: '48px',
        fontWeight: '200',
        fontFamily: "'Inter', monospace",
        color: '#1f2937',
        margin: '24px 0',
        letterSpacing: '-1px'
      }}>
        {formatTime(elapsedTime)}
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
        {!isActive ? (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => setIsActive(true)}
          >
            {elapsedTime > 0 ? 'Resume' : 'Start'}
          </Button>
        ) : (
          <Button
            danger
            icon={<PauseCircleOutlined />}
            onClick={() => setIsActive(false)}
          >
            Pause
          </Button>
        )}
        {isActive && (
          <Button
            icon={<FlagOutlined />}
            onClick={addLap}
          >
            Lap
          </Button>
        )}
        <Button
          icon={<ReloadOutlined />}
          onClick={reset}
          disabled={elapsedTime === 0}
        >
          Reset
        </Button>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div style={{
          maxHeight: '120px',
          overflowY: 'auto',
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '12px'
        }}>
          {laps.map((lap, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: index < laps.length - 1 ? '1px solid #e5e7eb' : 'none',
              fontSize: '14px'
            }}>
              <span style={{ color: '#6b7280' }}>Lap {laps.length - index}</span>
              <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>{formatTime(lap)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Stopwatch;
