import React, { useState, useEffect } from 'react';
import { Typography, Button, Card } from 'antd';

const { Title } = Typography;

function Stopwatch() {
  const [elapsedTime, setElapsedTime] = useState(0); // Elapsed time in milliseconds
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let intervalId;

    if (isActive) {
      intervalId = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 10); // Update every 10 milliseconds
      }, 10);
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

  // Function to format milliseconds into "00:00:00:00" format
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const formattedMilliseconds = (milliseconds % 1000).toString().padStart(3, '0');

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${formattedMilliseconds}`;
  };

  return (
    <Card
      title="Stopwatch"
      bordered={true}
      style={{
        width: 450,
        height: 250,
        textAlign: 'center',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Title level={2}>{formatTime(elapsedTime)}</Title>
      <Button onClick={startStopwatch} disabled={isActive}>
        Start
      </Button>
      <Button onClick={stopStopwatch}>Stop</Button>
      <Button onClick={resetStopwatch}>Reset</Button>
    </Card>
  );
}

export default Stopwatch;
