import React, { useState, useEffect, useReducer } from 'react';
import { Card, Typography, Input, List, FloatButton, Modal, Button, Form, Alert } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;
const { Search } = Input;
const fs = window.require('fs');
const { ipcRenderer } = window.require('electron');

const Weather = () => {


  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
  const [defCity, setDefCity] = useState('');
  const [ApiKey, setApiKey] = useState('');
  const [ListData, setListData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [city, setCity] = useState(defCity === '' ? 'istanbul' : defCity);
  const [weatherData, setWeatherData] = useState(null);
  const [SearchCity, setSearchCity] = useState('');


  const urlToOpen = 'https://home.openweathermap.org/api_keys';

  const handleLinkClick = () => {
    // Send an IPC message to the main process to open the URL
    ipcRenderer.send('open-external-link', urlToOpen);
  };

  const onFinish = (values) => {

    const dataToWrite = {
      cityname: !values.defcity ? defCity : values.defcity,
      apiKey: !values.apikey ? '' : values.apikey,
    };

    writeDataToFile(dataToWrite);
    setIsModalOpen(false);
  };

  useEffect(() => {
    try {
      const data = fs.readFileSync('weather.json', 'utf-8');
      const parsedData = JSON.parse(data);

      setDefCity(parsedData.cityname);
      setApiKey(parsedData.apiKey);
    } catch (error) {
      console.error('Error reading data from file:', error);

      // File does not exist, create it with default values
      const defaultData = {
        cityname: '',
        apiKey: '',
      };

      fs.writeFileSync('weather.json', JSON.stringify(defaultData, null, 2), 'utf-8');

      // Set the default values in your state
      setDefCity(defaultData.cityname);
      setApiKey(defaultData.apiKey);
    }
  }, [ignored]);
  function writeDataToFile(data) {
    try {
      fs.writeFileSync('weather.json', JSON.stringify(data, null, 2), 'utf-8');
      forceUpdate();
    } catch (error) {
      console.error('Error writing data to file:', error);
    }
  }

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {

    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const kelvinToCelsius = (kelvin) => {
    return (kelvin - 273.15).toFixed(1);
  };

  useEffect(() => {

    setWeatherData(() => null)
    setListData(() => null)
    const data = fs.readFileSync('weather.json', 'utf-8');
    var fileCityname = JSON.parse(data).cityname;
    if (city) {
      fetch(`http://api.openweathermap.org/data/2.5/weather?q=${SearchCity !== '' ? SearchCity : !fileCityname ? city : fileCityname}&APPID=${JSON.parse(data).apiKey}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => {
          // console.log(data)
          setWeatherData(data);
          setListData([
            {
              title: 'Temps °C (High / Low)',
              desc: `${kelvinToCelsius(data.main.temp_max)} °C / ${kelvinToCelsius(data.main.temp_min)} °C`
            },
            {
              title: 'Humidity % / Pressure hPa',
              desc: `${data.main.humidity} % / ${data.main.pressure} hPa`
            },
            {
              title: 'Wind Speed m/s',
              desc: `${data.wind.speed} m/s`
            },
            {
              title: 'Sunrise / Sunset Time',
              desc: new Date(data.sys.sunrise * 1000).toLocaleTimeString() + ' / ' + new Date(data.sys.sunset * 1000).toLocaleTimeString()
            },
          ])
        })
        .catch((error) => {
          console.error('Fetch error:', error);
        });
    }
  }, [ignored]);

  const handleSearch = (value) => {
    console.log(value)
    setSearchCity(value);
    forceUpdate();
  }

  const getWeatherIconUrl = (iconCode) => {
    const iconType = iconCode.endsWith('n') ? iconCode.replace('n', 'd') : iconCode;
    return `http://openweathermap.org/img/wn/${iconType}.png`;
  };

  return (

    <>
      <FloatButton style={{
        right: 94,
      }}
        tooltip="Settings"
        type="primary"
        shape="square"
        onClick={showModal}
        icon={<SettingOutlined />} />


      <Card
        bordered={true}
        style={{
          width: 550,
          margin: '0 auto',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        }}
      > <Search placeholder="Search city name here.." onSearch={value => handleSearch(value)} />
      </Card>

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
        <Card
          title="Basic Weather App"
          bordered={true}
          style={{
            width: 550,
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}
        >
          {weatherData ? (
            <> <div style={{ display: 'flex', flex: 'row', justifyContent: 'space-evenly' }}>
              <Text style={{ fontSize: '55px', fontWeight: 'bold', marginTop: '18px' }}>{kelvinToCelsius(weatherData.main.temp)} °C</Text>
              <img
                src={getWeatherIconUrl(weatherData.weather[0].icon)}
                alt="Weather Icon"
                style={{ width: '125px', height: '125px' }} />
            </div>
              <Title level={4}>{weatherData.name}</Title>
              <Text style={{ fontStyle: 'italic' }}>{weatherData.weather[0].description}</Text>
            </>
          ) : (
            <Alert
              style={{ textAlign: 'left' }}
              message={<b>Weather Config Error</b>}
              showIcon
              description={<><ul><li>API-KEY not found, set an API-KEY and default city name in weather settings.</li><li>Entered API-KEY is not a valid key.</li><li>Searched city is invalid</li></ul>
                <p style={{ textAlign: 'center' }}>You can get your free API-KEY from <a href='##' onClick={handleLinkClick}>here</a></p>
              </>}
              type="warning"
            />

          )}
        </Card>
        {ListData ?
          <Card
            title="Details"
            style={{
              width: 550,
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}

          >
            <List
              grid={{
                gutter: 16,
                column: 2,
              }}
              dataSource={ListData}
              renderItem={(item) => (
                <List.Item>
                  <Card style={{
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                  }} title={item.title}>{item.desc}</Card>
                </List.Item>
              )} />
          </Card> : null}
      </div>

      {/** Setting Modal **/}
      <Modal title="Weather App Settings" open={isModalOpen} onOk={handleOk} footer={null} onCancel={handleCancel}>
        <Form
          name="basic"
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
          style={{
            maxWidth: 600,
            marginTop: '50px'
          }}
          initialValues={{
            remember: false,
          }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Set Default City Name"
            name="defcity"
            rules={[
              {
                required: false,
                message: 'Please input your city name',
              },
            ]}
          >
            <Input defaultValue={defCity} placeholder='enter city name' />
          </Form.Item>

          <Form.Item
            label="Set API-KEY"
            name="apikey"
            rules={[
              {
                required: false,
                message: 'Please input your API-KEY!',
              },
            ]}
          >
            <Input.Password defaultValue={ApiKey} placeholder='enter api key here' />
          </Form.Item>

          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <Button type="primary" htmlType="submit">
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>

  );
};

export default Weather;
