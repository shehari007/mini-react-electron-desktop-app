import React from 'react';
import { 
  CalculatorOutlined, 
  OrderedListOutlined, 
  ClockCircleOutlined, 
  CloudOutlined,
  SwapOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const HomePage = () => {
  const features = [
    {
      icon: <CalculatorOutlined />,
      title: 'Calculator',
      description: 'Basic & Scientific calculator with history. Supports trig, log, memory functions.',
      color: '#6366f1',
      bgColor: '#eef2ff'
    },
    {
      icon: <SwapOutlined />,
      title: 'Converters',
      description: 'Convert length, weight, temperature, speed, time, data, area & volume.',
      color: '#10b981',
      bgColor: '#ecfdf5'
    },
    {
      icon: <OrderedListOutlined />,
      title: 'Todo List',
      description: 'Manage tasks with completion tracking, filters, and persistent storage.',
      color: '#f59e0b',
      bgColor: '#fffbeb'
    },
    {
      icon: <ClockCircleOutlined />,
      title: 'Clock & Timer',
      description: 'Real-time clock, countdown timer with alerts, and precision stopwatch with laps.',
      color: '#ec4899',
      bgColor: '#fdf2f8'
    },
    {
      icon: <GlobalOutlined />,
      title: 'World Clock',
      description: 'Track multiple timezones, compare time differences across cities.',
      color: '#8b5cf6',
      bgColor: '#f5f3ff'
    },
    {
      icon: <CloudOutlined />,
      title: 'Weather',
      description: 'Real-time weather data with detailed forecasts for any city worldwide.',
      color: '#3b82f6',
      bgColor: '#eff6ff'
    }
  ];

  const stats = [
    { icon: <AppstoreOutlined />, value: '7+', label: 'Tools' },
    { icon: <ThunderboltOutlined />, value: 'Fast', label: 'Performance' },
    { icon: <GlobalOutlined />, value: '100%', label: 'Offline Ready' }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: '24px',
        padding: '48px',
        color: 'white',
        textAlign: 'center',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '400px',
          height: '400px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '16px' }}>
            <img 
              src="logo.png" 
              alt="AppBox" 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
              }} 
            />
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: '42px', fontWeight: '700' }}>
            AppBox
          </h1>
          <p style={{ margin: '0 0 8px', fontSize: '20px', opacity: 0.9 }}>
            Your All-in-One Utility Toolbox
          </p>
          <p style={{ margin: '0 0 32px', fontSize: '16px', opacity: 0.7 }}>
            Calculator • Converters • Todo • Clock • Weather & More
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '24px', 
            flexWrap: 'wrap'
          }}>
            {stats.map((stat, index) => (
              <div key={index} style={{ 
                textAlign: 'center',
                padding: '16px 28px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>{stat.icon}</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <h3 style={{ 
        fontSize: '20px', 
        fontWeight: '600', 
        marginBottom: '20px',
        color: '#1f2937'
      }}>
        🧰 Available Tools
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {features.map((feature, index) => (
          <div key={index} style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: '1px solid transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)';
            e.currentTarget.style.borderColor = feature.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
          >
            <div 
              style={{ 
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '16px',
                background: feature.bgColor, 
                color: feature.color 
              }}
            >
              {feature.icon}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
              {feature.title}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
              {feature.description}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div style={{ 
        padding: '24px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#1f2937'
        }}>
          💡 Quick Tips
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ 
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            borderLeft: '4px solid #6366f1'
          }}>
            <strong>Calculator:</strong> Use keyboard for quick input. Scientific mode has sin, cos, log, and more!
          </div>
          <div style={{ 
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            borderLeft: '4px solid #10b981'
          }}>
            <strong>Converters:</strong> 8 categories with instant conversion between 50+ units.
          </div>
          <div style={{ 
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <strong>World Clock:</strong> Add multiple cities to track time zones simultaneously.
          </div>
          <div style={{ 
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <strong>Weather:</strong> Click settings ⚙️ to add your OpenWeatherMap API key.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
