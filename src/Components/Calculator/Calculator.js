import React, { useState } from 'react';
import { Input, Button, Row, Col } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import * as math from 'mathjs';
import { Card } from 'antd';
function Calculator() {
    const [input, setInput] = useState('0');
    const [result, setResult] = useState('');

    const handleButtonClick = (value) => {
        console.log(value)
        if (value === 'Escape') {
            setResult('');
            setInput('');
        } else if (value !== 'pow') {
            setInput((prevInput) => prevInput === '0' ? value : prevInput + value);
        } else if (value === 'pow') {
            calculateResult('pow');
        }
    };

    const handleKeyPress = (event) => {
        const key = event.key;
        const validKeys = '0123456789+-*/.%^';
        if (validKeys.includes(key)) {
            handleButtonClick(key);
        } else if (key === 'Enter') {
            calculateResult();
        } else if (key === 'Escape') {
            setResult('');
            setInput('0');
        }
        else if (key === 'Backspace') {
            setInput((prevInput) => prevInput.slice(0, -1));
        }
    };

    const calculateResult = (pow) => {
        console.log(input);

        try {
            if (!input.includes('%') && pow !== 'pow') {
                const calculatedResult = math.evaluate(input);
                setInput(calculatedResult.toString());
            } else if (pow !== 'pow' && input.includes('%')) {
                const modifiedInput = input.replace('%', '%*');
                const calculatedResult = math.evaluate(modifiedInput);
                setInput(calculatedResult.toString());
            } else if (pow === 'pow') {
                const modifiedInput = input + '^2';
                const calculatedResult = math.evaluate(modifiedInput);
                setInput(calculatedResult.toString());
            }
        } catch (error) {
            setInput('Error');
        }
    };

    return (
        <Card
            title="Basic Calculator "
            bordered={true}
            style={{
                width: 550,
                margin: '0 auto',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', // Add a shadow
            }}
        >
            <div className="calculator">
                <Input
                    value={input}
                    onKeyDown={handleKeyPress}
                    readOnly
                    autoFocus
                    className="input-field"
                />
                <Row gutter={8}>
                    <Col span={24}>
                        <div className="buttons">
                            <Button onClick={() => handleButtonClick('1')}>1</Button>
                            <Button onClick={() => handleButtonClick('2')}>2</Button>
                            <Button onClick={() => handleButtonClick('3')}>3</Button>
                            <Button onClick={() => handleButtonClick('+')} icon={<PlusOutlined />} />
                            <Button onClick={() => handleButtonClick('4')}>4</Button>
                            <Button onClick={() => handleButtonClick('5')}>5</Button>
                            <Button onClick={() => handleButtonClick('6')}>6</Button>
                            <Button onClick={() => handleButtonClick('-')} icon={<MinusOutlined />} />
                            <Button onClick={() => handleButtonClick('7')}>7</Button>
                            <Button onClick={() => handleButtonClick('8')}>8</Button>
                            <Button onClick={() => handleButtonClick('9')}>9</Button>
                            <Button onClick={() => handleButtonClick('*')}>*</Button>
                            <Button onClick={() => handleButtonClick('0')}>0</Button>
                            <Button onClick={() => handleButtonClick('.')}>.</Button>
                            <Button onClick={() => handleButtonClick('/')}>/</Button>
                            <Button onClick={() => handleButtonClick('%')}>%</Button>
                            <Button onClick={() => handleButtonClick('^')}>x<sup>y</sup></Button>
                            <Button onClick={() => handleButtonClick('pow')}>x<sup>2</sup></Button>
                            <Button onClick={calculateResult} >=</Button>
                        </div>
                    </Col>
                    {/* <Col style={{marginLeft: '25px'}} span={6}>
          <Button
            onClick={() => handleButtonClick('Escape')}
            icon={<CloseCircleOutlined />}
            className="clear-button"
          >
            C
          </Button>
        </Col> */}
                </Row>
                <div className="result">{result}</div>
            </div>
        </Card>

    );
}

export default Calculator;
