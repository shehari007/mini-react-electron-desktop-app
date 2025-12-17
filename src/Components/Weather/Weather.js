import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, Form, Modal, Alert, Spin } from 'antd';
import { 
  SettingOutlined, 
  SearchOutlined,
  EnvironmentOutlined,
  CloudOutlined,
  SwapOutlined,
  EyeOutlined
} from '@ant-design/icons';

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && 
    typeof window.process === 'object' && 
    window.process.type === 'renderer';
};

// Storage helper functions - use localStorage for both web and electron
const storage = {
  get: (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }
};

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [config, setConfig] = useState(() => 
    storage.get('weatherConfig', { city: '', apiKey: '' })
  );

  const kelvinToCelsius = (kelvin) => (kelvin - 273.15).toFixed(1);

  const fetchWeather = useCallback(async (city) => {
    if (!config.apiKey) {
      setError('Please configure your API key in settings');
      return;
    }

    const cityToSearch = city || config.city || 'London';
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityToSearch}&APPID=${config.apiKey}`
      );

      if (!response.ok) {
        throw new Error(response.status === 404 ? 'City not found' : 'Failed to fetch weather');
      }

      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err.message);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, [config.apiKey, config.city]);

  useEffect(() => {
    if (config.apiKey && config.city) {
      fetchWeather();
    }
  }, [config.apiKey, config.city, fetchWeather]);

  const handleSearch = () => {
    if (searchCity.trim()) {
      fetchWeather(searchCity.trim());
    }
  };

  const handleSaveSettings = (values) => {
    const newConfig = {
      city: values.city || config.city,
      apiKey: values.apiKey || config.apiKey
    };
    storage.set('weatherConfig', newConfig);
    setConfig(newConfig);
    setIsModalOpen(false);
    if (newConfig.apiKey) {
      fetchWeather(newConfig.city);
    }
  };

  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const openExternalLink = (url) => {
    if (isElectron()) {
      try {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('open-external-link', url);
      } catch (e) {
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="weather-page">
      {/* Search Section */}
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder="Search for a city..."
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            onPressEnter={handleSearch}
            style={{ flex: 1, minWidth: '220px' }}
            size="large"
          />
          <Button type="primary" onClick={handleSearch} size="large">
            Search
          </Button>
          <Button 
            icon={<SettingOutlined />} 
            onClick={() => setIsModalOpen(true)}
            size="large"
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Fetching weather data...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert
          message="Weather Error"
          description={
            <div>
              <p>{error}</p>
              {!config.apiKey && (
                <p style={{ marginTop: '12px' }}>
                  Get your free API key from{' '}
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      openExternalLink('https://home.openweathermap.org/api_keys');
                    }}
                  >
                    OpenWeatherMap
                  </a>
                </p>
              )}
            </div>
          }
          type="warning"
          showIcon
          style={{ borderRadius: '16px', marginBottom: '24px' }}
        />
      )}

      {/* Weather Data */}
      {weatherData && !loading && (
        <div className="weather-container">
          {/* Main Weather Card */}
          <div className="weather-main-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <EnvironmentOutlined style={{ fontSize: '20px' }} />
              <span style={{ fontSize: '16px', opacity: 0.9 }}>{weatherData.sys?.country}</span>
            </div>
            <h2 className="weather-city">{weatherData.name}</h2>
            <img 
              src={getWeatherIcon(weatherData.weather[0].icon)} 
              alt={weatherData.weather[0].description}
              style={{ width: '100px', height: '100px' }}
            />
            <div className="weather-temp">{kelvinToCelsius(weatherData.main.temp)}°</div>
            <div className="weather-desc">{weatherData.weather[0].description}</div>
            <div style={{ 
              marginTop: '20px', 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '24px',
              fontSize: '14px',
              opacity: 0.9
            }}>
              <span>H: {kelvinToCelsius(weatherData.main.temp_max)}°</span>
              <span>L: {kelvinToCelsius(weatherData.main.temp_min)}°</span>
            </div>
          </div>

          {/* Weather Details Card */}
          <div className="weather-details-card">
            <h3 style={{ marginBottom: '20px', fontWeight: '600', color: '#1f2937' }}>
              Weather Details
            </h3>
            
            <div className="weather-detail-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                <SwapOutlined /> Feels Like
              </span>
              <span style={{ fontWeight: '600' }}>{kelvinToCelsius(weatherData.main.feels_like)}°C</span>
            </div>

            <div className="weather-detail-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                💧 Humidity
              </span>
              <span style={{ fontWeight: '600' }}>{weatherData.main.humidity}%</span>
            </div>

            <div className="weather-detail-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                🌬️ Wind Speed
              </span>
              <span style={{ fontWeight: '600' }}>{weatherData.wind.speed} m/s</span>
            </div>

            <div className="weather-detail-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                📊 Pressure
              </span>
              <span style={{ fontWeight: '600' }}>{weatherData.main.pressure} hPa</span>
            </div>

            <div className="weather-detail-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                <EyeOutlined /> Visibility
              </span>
              <span style={{ fontWeight: '600' }}>{(weatherData.visibility / 1000).toFixed(1)} km</span>
            </div>

            <div className="weather-detail-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                <CloudOutlined /> Clouds
              </span>
              <span style={{ fontWeight: '600' }}>{weatherData.clouds?.all}%</span>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: '#f8fafc', 
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-around'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px' }}>🌅</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Sunrise</div>
                <div style={{ fontWeight: '600' }}>
                  {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px' }}>🌇</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Sunset</div>
                <div style={{ fontWeight: '600' }}>
                  {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <Modal
        title="Weather Settings"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleSaveSettings}
          initialValues={config}
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            label="Default City"
            name="city"
          >
            <Input placeholder="Enter city name (e.g., London)" />
          </Form.Item>

          <Form.Item
            label="API Key"
            name="apiKey"
            extra={
              <span>
                Get your free API key from{' '}
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    openExternalLink('https://home.openweathermap.org/api_keys');
                  }}
                >
                  OpenWeatherMap
                </a>
              </span>
            }
          >
            <Input.Password placeholder="Enter your API key" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Weather;
