import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [selectedTime, setSelectedTime] = useState(60);
  const audioRef = useRef(null);

  useEffect(() => {
    let intervalId;

    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 4 && prevTime > 0 && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => clearInterval(intervalId);
  }, [isActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const presets = [
    { label: '30s', value: 30 },
    { label: '1m', value: 60 },
    { label: '5m', value: 300 },
    { label: '10m', value: 600 },
  ];

  const progress = ((selectedTime - timeLeft) / selectedTime) * 100;

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
        ⏱️ Countdown Timer
      </div>
      
      {/* Progress Ring */}
      <div style={{
        position: 'relative',
        width: '160px',
        height: '160px',
        margin: '16px auto',
      }}>
        <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke={timeLeft <= 4 ? '#ef4444' : '#6366f1'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={440}
            strokeDashoffset={440 - (440 * progress / 100)}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '36px',
          fontWeight: '300',
          color: timeLeft <= 4 ? '#ef4444' : '#1f2937'
        }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Preset Buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
        {presets.map(preset => (
          <Button
            key={preset.value}
            size="small"
            type={selectedTime === preset.value ? 'primary' : 'default'}
            disabled={isActive}
            onClick={() => {
              setSelectedTime(preset.value);
              setTimeLeft(preset.value);
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        {!isActive ? (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => setIsActive(true)}
            disabled={timeLeft === 0}
          >
            Start
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
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setIsActive(false);
            setTimeLeft(selectedTime);
          }}
        >
          Reset
        </Button>
      </div>

      {timeLeft <= 4 && timeLeft > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '8px 16px',
          background: '#fef2f2',
          color: '#dc2626',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          ⚠️ Time is almost up!
        </div>
      )}

      <audio ref={audioRef}>
        <source src="audio.wav" type="audio/wav" />
      </audio>
    </div>
  );
}

export default CountdownTimer;
