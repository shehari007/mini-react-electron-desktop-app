import React, { useState, useEffect } from 'react';
import { List, Input, Button, Card } from 'antd';
const fs = window.require('fs');

function ToDoList() {
   
    const [tasks, setTasks] = useState([]);
    const [task, setTask] = useState('');


    useEffect(() => {

        try {
            const data = fs.readFileSync('todos.json', 'utf-8');
            const parsedData = JSON.parse(data);
            setTasks(parsedData);
        } catch (error) {
            console.error('Error reading data from file:', error);
        }
    }, []);



    function writeDataToFile(data) {
        try {
            fs.writeFileSync('todos.json', JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error writing data to file:', error);
        }
    }
    const addTask = () => {
        if (task.trim() === '') return;
        const newTasks = [...tasks, task];
        setTasks(newTasks);
        setTask('');

        writeDataToFile(newTasks);
    };
    const clearAll = () => {
        const newTasks = [];

        setTasks(newTasks);

        writeDataToFile(newTasks);
    }
    const removeTask = (index) => {
        const newTasks = [...tasks];
        newTasks.splice(index, 1);
        setTasks(newTasks);

        writeDataToFile(newTasks);
    };

    return (
        <Card
            title="Basic Todo List"
            bordered={true}
            style={{
                width: 550,
                margin: '0 auto',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            }}
        >
            <div className="todo-app">

                <div className="input-container">
                    <Input
                        id="calculatorInput"
                        placeholder="Enter a task"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                    />

                </div>
                <Button type="primary" onClick={addTask}>
                    Add Task
                </Button>
                <Button type="primary" style={{ marginLeft: '5px' }} onClick={clearAll}>
                    Clear all
                </Button>
                <List
                    bordered
                    dataSource={tasks}
                    style={{
                        marginTop: '15px'
                    }}
                    renderItem={(item, index) => (
                        <List.Item
                            actions={[
                                <Button type="primary" style={{ marginTop: '-5px' }} danger onClick={() => removeTask(index)}>
                                    Delete
                                </Button>
                            ]}
                        >
                            {index + 1}. {item}
                        </List.Item>
                    )}
                />
            </div>
        </Card>
    );
}

export default ToDoList;
