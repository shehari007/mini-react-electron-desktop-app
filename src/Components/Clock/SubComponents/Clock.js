import React, { useState, useEffect } from 'react';
import { Typography, Card } from 'antd';

const { Title } = Typography;

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card
      title="Clock"
      bordered={true}
      style={{
        width: 450,

        textAlign: 'center',
        margin: '0 auto',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', 
      }}
    >
      <Title style={{marginTop:'-8px'}}  level={2}>
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}<br />

      </Title>
      {time.toLocaleDateString()}
    </Card>
  );
}

export default Clock;
