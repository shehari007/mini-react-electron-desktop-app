import React, { useState, useEffect } from 'react';
import { Layout, Menu, ConfigProvider, theme } from 'antd';
import './App.css';
import { 
  HomeOutlined, 
  CalculatorOutlined, 
  OrderedListOutlined, 
  ClockCircleOutlined, 
  CloudOutlined, 
  InfoCircleOutlined,
  MenuOutlined,
  CloseOutlined,
  MinusOutlined,
  SwapOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { Calculator, ToDoList, MainClock, Weather, Converter, WorldClock } from './Components';
import HomePage from './Components/Home/HomePage';
import About from './Components/About/About';

const { Header, Content, Sider } = Layout;

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && 
    typeof window.process === 'object' && 
    window.process.type === 'renderer';
};

// Safe ipcRenderer access
const getIpcRenderer = () => {
  if (isElectron()) {
    try {
      return window.require('electron').ipcRenderer;
    } catch (e) {
      return null;
    }
  }
  return null;
};

function App() {
  const [menuKey, setMenuKey] = useState('1');
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const ipcRenderer = getIpcRenderer();
  const electron = isElectron();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuChange = (e) => {
    setMenuKey(e.key);
    if (isMobile) setCollapsed(true);
  };

  const onClickClose = () => {
    if (ipcRenderer) ipcRenderer.send('close');
  };

  const onClickMin = () => {
    if (ipcRenderer) ipcRenderer.send('minimize');
  };

  const menuItems = [
    { key: '1', icon: <HomeOutlined />, label: 'Home' },
    { key: '2', icon: <CalculatorOutlined />, label: 'Calculator' },
    { key: '3', icon: <SwapOutlined />, label: 'Converters' },
    { key: '4', icon: <OrderedListOutlined />, label: 'Todo List' },
    { key: '5', icon: <ClockCircleOutlined />, label: 'Clock & Timer' },
    { key: '6', icon: <GlobalOutlined />, label: 'World Clock' },
    { key: '7', icon: <CloudOutlined />, label: 'Weather' },
    { key: '8', icon: <InfoCircleOutlined />, label: 'About' },
  ];

  const renderContent = () => {
    switch (menuKey) {
      case '1': return <HomePage />;
      case '2': return <Calculator />;
      case '3': return <Converter />;
      case '4': return <ToDoList />;
      case '5': return <MainClock />;
      case '6': return <WorldClock />;
      case '7': return <Weather />;
      case '8': return <About />;
      default: return <HomePage />;
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <Layout className={`app-layout ${electron ? 'is-electron' : ''}`}>
        {/* Electron Window Controls */}
        {electron && (
          <div className="window-controls">
            <button className="window-btn minimize" onClick={onClickMin}>
              <MinusOutlined />
            </button>
            <button className="window-btn close" onClick={onClickClose}>
              <CloseOutlined />
            </button>
          </div>
        )}

        {/* Sidebar */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          collapsedWidth={isMobile ? 0 : 80}
          trigger={null}
          className="app-sider"
          width={220}
        >
          <div className="logo-container">
            {!collapsed && (
              <div className="logo-text">
                <img src="logo.png" alt="AppBox" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                <span>AppBox</span>
              </div>
            )}
            {collapsed && <img src="logo.png" alt="AppBox" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[menuKey]}
            onClick={handleMenuChange}
            items={menuItems}
            className="side-menu"
          />
        </Sider>

        <Layout className="main-layout">
          {/* Header */}
          <Header className="app-header">
            <button 
              className="menu-toggle"
              onClick={() => setCollapsed(!collapsed)}
            >
              <MenuOutlined />
            </button>
            <div className="header-title">
              {menuItems.find(item => item.key === menuKey)?.label || 'Home'}
            </div>
            {/* {!isElectron() && (
              <div className="header-actions">
                <span className="version-badge">v2.0</span>
              </div>
            )} */}
          </Header>

          {/* Main Content */}
          <Content className="app-content">
            <div className="content-wrapper">
              {renderContent()}
            </div>
          </Content>
        </Layout>

        {/* Mobile Overlay */}
        {isMobile && !collapsed && (
          <div className="mobile-overlay" onClick={() => setCollapsed(true)} />
        )}
      </Layout>
    </ConfigProvider>
  );
}

export default App;
