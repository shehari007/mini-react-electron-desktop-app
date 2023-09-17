import React, { useState, useEffect } from 'react';
import { Typography, Button } from 'antd';

const { Title } = Typography;

function Stopwatch() {
  const [elapsedTime, setElapsedTime] = useState(0); // Elapsed time in seconds
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let intervalId;

    if (isActive) {
      intervalId = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isActive]);

  const startStopwatch = () => {
    setIsActive(true);
  };

  const stopStopwatch = () => {
    setIsActive(false);
  };

  const resetStopwatch = () => {
    setIsActive(false);
    setElapsedTime(0);
  };

  return (
    <div>
      <Title level={2}>{elapsedTime} seconds</Title>
      <Button onClick={startStopwatch} disabled={isActive}>
        Start
      </Button>
      <Button onClick={stopStopwatch}>Stop</Button>
      <Button onClick={resetStopwatch}>Reset</Button>
    </div>
  );
}

export default Stopwatch;
