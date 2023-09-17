import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, Card, Alert } from 'antd';

const { Title } = Typography;

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(10); 
  const [isActive, setIsActive] = useState(false);
  const [adjustableTime, setAdjustableTime] = useState(10); 
  const audioRef = useRef(null);

  useEffect(() => {
    let intervalId;

    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
        if (timeLeft <= 4 && timeLeft > 0) {
          audioRef.current.play(); 
        }
      }, 1000);
    }

    if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => clearInterval(intervalId);
  }, [isActive, timeLeft]);

  const startTimer = () => {
    setIsActive(true);
  };

  const stopTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(adjustableTime);
  };

  const adjustTime = (newTime) => {
    if (!isActive) {
      setAdjustableTime(newTime);
      setTimeLeft(newTime);
    }
  };

  return (
    <Card
    title="Countdown Timer"
   bordered={true}
   style={{
    width: 450,
                height: 250,
    textAlign: 'center',
    
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', 
}}
> <Alert style={{marginTop:'-8px'}}  message="A sound will alert when timer is less than 4 sec" type="warning" showIcon />
    <div>
      <Title style={{marginTop:'0px'}} level={2}>{timeLeft} seconds</Title>
      <Button type='primary' success onClick={startTimer} disabled={isActive}>
        Start
      </Button>
      <Button onClick={stopTimer} type='primary' danger>Stop</Button>
      <Button onClick={resetTimer}>Reset</Button>
      <Button onClick={() => adjustTime(10)}>10 seconds</Button>
      <Button onClick={() => adjustTime(30)}>30 seconds</Button>
      <Button onClick={() => adjustTime(60)}>60 seconds</Button>
      <audio ref={audioRef}>
        <source src="audio.wav" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
    
    </Card>
  );
}

export default CountdownTimer;
