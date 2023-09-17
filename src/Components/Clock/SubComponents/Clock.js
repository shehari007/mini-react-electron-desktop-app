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
            
           bordered={true}
            style={{
                width: 550,
                textAlign: 'center',
                margin: '0 auto',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', // Add a shadow
            }}
        >
    <Title level={2}>
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}<br/>
     
    </Title>
    {time.toLocaleDateString()}
    </Card>
  );
}

export default Clock;
