import React, { useState, useEffect } from 'react';
import { Typography, Button } from 'antd';

const { Title } = Typography;

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(10); // Set the initial time in seconds
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let intervalId;

    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isActive, timeLeft]);

  const startTimer = () => {
    setIsActive(true);
  };

  const stopTimer = () => {
    setIsActive(false);
  };

  return (
    <div>
      <Title level={2}>{timeLeft} seconds</Title>
      <Button onClick={startTimer} disabled={isActive}>
        Start
      </Button>
      <Button onClick={stopTimer}>Stop</Button>
    </div>
  );
}

export default CountdownTimer;
