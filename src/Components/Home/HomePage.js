import React from 'react'
import { Card, Collapse } from 'antd';
import { CalculatorOutlined, OrderedListOutlined, ClockCircleOutlined, AimOutlined } from '@ant-design/icons';
const HomePage = () => {
    const items = [
        {
            key: '1',
            
            label: <><CalculatorOutlined/> <span>Calculator</span></> ,
            children: <p>You can use keyboard as an input to enter numbers and perform operations. <b>ESC</b> key is assigned to clear screen and <b>ENTER</b> key is assigned to perform operation (=).<br /><b>NOTE: </b>Performed operations are not persistent, calculator resets to default if section is changed.</p>
        },
        {
            key: '2',
            label: <><OrderedListOutlined/> <span>Todo List</span></>,
            children: <p>You can perform Add, Remove, Clear All operations in Todo List, a simple design to follow your todo plans.<br /><b>NOTE: </b>Data stored in list is persistent, it stores data on your storage so you can continue later after closing the application.</p>,
        },
        {
            key: '3',
            label: <><ClockCircleOutlined/> <span>Clock</span></>,
            children: <p>It consist of 3 sub Components Clock, Timer, Stopwatch, the Countdown Timer will play a sound and alert you if time is less than 4 sec.<br /><b>NOTE: </b>Timer and Stopwatch states are not persistent and resets to default state if section is changed.</p>,
        },
        {
            key: '4',
            label: <><AimOutlined/> <span>Weather App</span></>,
            children: <p>Internet connnection and API-KEY is required to work, you can set API-KEY and default city in Weather settings, the button is located at bottom right corner on weather app. <br /><b>NOTE: </b>Data set in settings is persistent it will not lost after closing the application.</p>,
        },
    ];
    return (
        <div align="center">
            <Card

                bordered={true}
                style={{
                    width: 400,
                    margin: '0 auto',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                }}
            >
                <img src='logo.png' height={150} width={210} alt='logo' />
                <p><b>Mini 4 in 1 Electro App</b></p>
            </Card>
            <div style={{ marginTop: '35px' }}>
                <Card
                    title="Detail about sections"
                    bordered={true}
                    style={{
                        textAlign: 'left',
                        width: 'auto',
                        margin: '0 auto',
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <Collapse accordion style={{ textAlign: 'left' }} items={items} />
                </Card>
            </div>
        </div>

    )
}

export default HomePage
