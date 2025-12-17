import React, { useState, useEffect } from 'react';

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
      borderRadius: '24px',
      padding: '48px',
      textAlign: 'center',
      color: 'white',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
    }}>
      <div style={{ fontSize: '16px', opacity: 0.7, marginBottom: '8px' }}>
        🕐 Current Time
      </div>
      <div style={{
        fontSize: '72px',
        fontWeight: '200',
        fontFamily: "'Inter', monospace",
        letterSpacing: '-2px',
        lineHeight: 1.1
      }}>
        {formatTime(time)}
      </div>
      <div style={{
        marginTop: '16px',
        fontSize: '18px',
        opacity: 0.8
      }}>
        {formatDate(time)}
      </div>
    </div>
  );
}

export default Clock;
