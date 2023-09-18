import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import './App.css';
import { HomeOutlined, CalculatorOutlined, OrderedListOutlined, ClockCircleOutlined, AimOutlined, HeartOutlined } from '@ant-design/icons';
import { Calculator, ToDoList, MainClock, Weather } from './Components';
import HomePage from './Components/Home/HomePage';
import About from './Components/About/About';
const { Header, Content } = Layout;
const { ipcRenderer } = window.require('electron');

function App() {

  const [menuKey, setMenuKey] = useState('1');

  const handleMenuChange = (selectedKey) => {
    setMenuKey(selectedKey);
  };
  const onClickClose = () => {
    ipcRenderer.send('close');
  }
  const onClickMin = () => {
    ipcRenderer.send('minimize');
  }

  return (
    <><div className="custom-buttons">
      <div className="custom-button" id="minimize-button" onClick={onClickMin}>-</div>
      <div className="custom-button" id="close-button" onClick={onClickClose}>x</div>
    </div><Layout style={{ background: 'none' }} id='drag'>
        <Header>
    
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={menuKey}
            selectedKeys={menuKey}
            onSelect={(e) => handleMenuChange(e.key)}>
            <div className="logo" align="left"  ><img style={{ marginBottom: '-8px', marginLeft: '-18px' }} src='logo.png' height={30} width={35} alt='menu' /></div>
            <Menu.Item icon={<HomeOutlined/>} style={{ marginLeft: '20px' }} key="1">Home</Menu.Item>
            <Menu.Item icon={<CalculatorOutlined/>} key="2">Calculator</Menu.Item>
            <Menu.Item icon={<OrderedListOutlined/>} key="3">Todo List</Menu.Item>
            <Menu.Item icon={<ClockCircleOutlined/>} key="4">Clock</Menu.Item>
            <Menu.Item icon={<AimOutlined/>} key="5">Weather App</Menu.Item>
            <Menu.Item icon={<HeartOutlined/>} key="6">About App</Menu.Item>

          </Menu>

        </Header>
        <Content style={{ padding: '0 50px', marginTop: 80 }}>
          {menuKey === '1' ?
            <><HomePage /></>
            :
            menuKey === '2' ?
              <><Calculator /></>
              :
              menuKey === '3' ?
                <><ToDoList /></>
                :
                menuKey === '4' ?
                  <><MainClock /></>
                  :
                  menuKey === '5' ?
                    <><Weather /></>
                    :
                    menuKey === '6' ?
                    <><About/></>
                    :
                    null}


        </Content>
      </Layout></>
  );
}

export default App;
