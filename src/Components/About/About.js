import React from 'react';
import { Button } from 'antd';
import { 
  GithubOutlined, 
  HeartFilled, 
  CodeOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  CalculatorOutlined,
  SwapOutlined,
  OrderedListOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  CloudOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && 
    typeof window.process === 'object' && 
    window.process.type === 'renderer';
};

const About = () => {
  const openLink = (url) => {
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

  const features = [
    { icon: <ThunderboltOutlined />, title: 'Fast', desc: 'Optimized performance' },
    { icon: <SafetyOutlined />, title: 'Secure', desc: 'Local data storage' },
    { icon: <RocketOutlined />, title: 'Modern', desc: 'Clean UI design' },
    { icon: <CodeOutlined />, title: 'Open Source', desc: 'MIT Licensed' },
  ];

  const tools = [
    { icon: <CalculatorOutlined />, name: 'Calculator', desc: 'Basic & Scientific' },
    { icon: <SwapOutlined />, name: 'Converters', desc: '8 Categories' },
    { icon: <OrderedListOutlined />, name: 'Todo List', desc: 'Task Manager' },
    { icon: <ClockCircleOutlined />, name: 'Clock & Timer', desc: 'Stopwatch & Countdown' },
    { icon: <GlobalOutlined />, name: 'World Clock', desc: 'Multi-timezone' },
    { icon: <CloudOutlined />, name: 'Weather', desc: 'Real-time Data' },
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* Main Card */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: '24px',
        padding: '48px',
        color: 'white',
        textAlign: 'center',
        marginBottom: '24px',
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
          <img 
            src="logo.png" 
            alt="AppBox" 
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              marginBottom: '24px'
            }}
          />
          <h1 style={{ margin: '0 0 8px', fontSize: '36px', fontWeight: '700' }}>
            AppBox
          </h1>
          <p style={{ margin: '0 0 8px', fontSize: '18px', opacity: 0.9 }}>
            Your All-in-One Utility Toolbox
          </p>
          <p style={{ margin: '0 0 24px', fontSize: '14px', opacity: 0.7 }}>
            7+ productivity tools in a single beautiful application
          </p>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            <AppstoreOutlined style={{ marginRight: '8px' }} />
            Version 2.0.0
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginTop: '32px'
          }}>
            {features.map((feature, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '16px',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{feature.icon}</div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{feature.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
          🧰 Included Tools
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px'
        }}>
          {tools.map((tool, index) => (
            <div key={index} style={{
              padding: '20px 16px',
              background: '#f8fafc',
              borderRadius: '14px',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                fontSize: '28px', 
                marginBottom: '10px',
                color: '#6366f1'
              }}>
                {tool.icon}
              </div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                {tool.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {tool.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* About Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600' }}>
            About AppBox
          </h3>
          <p style={{ color: '#6b7280', lineHeight: 1.7, margin: '0 0 20px' }}>
            AppBox is a comprehensive utility suite featuring a Scientific Calculator 
            with history, 8-category Unit Converter, Todo List, Clock & Timer with 
            Stopwatch, World Clock for multiple timezones, and Weather App. 
            Built for both desktop (Electron) and web with a modern, responsive design.
          </p>
          <div style={{ 
            background: '#f8fafc', 
            padding: '16px', 
            borderRadius: '12px',
            fontSize: '14px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Technologies:</strong>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['React 19', 'Ant Design 6', 'Electron', 'Math.js', 'localStorage'].map(tech => (
                <span key={tech} style={{
                  background: '#e0e7ff',
                  color: '#4338ca',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Developer Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600' }}>
            Developer
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px'
            }}>
              <GithubOutlined style={{ fontSize: '28px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>
                Muhammad Sheharyar Butt
              </div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                Full Stack Developer
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button 
              icon={<GithubOutlined />}
              onClick={() => openLink('https://github.com/shehari007')}
            >
              GitHub Profile
            </Button>
            <Button 
              type="primary"
              icon={<CodeOutlined />}
              onClick={() => openLink('https://github.com/shehari007/mini-react-electron-desktop-app')}
            >
              View Source
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '32px',
        padding: '24px',
        color: '#6b7280',
        fontSize: '14px'
      }}>
        Made with <HeartFilled style={{ color: '#ef4444' }} /> using React & Ant Design
        <br />
        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          © {new Date().getFullYear()} AppBox - All rights reserved
        </span>
      </div>
    </div>
  );
};

export default About;
