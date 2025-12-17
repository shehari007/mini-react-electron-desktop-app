import React from 'react';
import Clock from './SubComponents/Clock';
import CountdownTimer from './SubComponents/CountdownTimer';
import Stopwatch from './SubComponents/Stopwatch';

const MainClock = () => {
  return (
    <div style={{ width: '100%' }}>
      {/* Main Clock */}
      <Clock />
      
      {/* Timer & Stopwatch Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          marginTop: '24px',
        }}
      >
        <CountdownTimer />
        <Stopwatch />
      </div>
    </div>
  );
};

export default MainClock;
