import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import './App.css';
import { Calculator, ToDoList, MainClock } from './Components';
const { Header, Content } = Layout;

function App() {
  const [menuKey, setMenuKey] = useState('1');
  const handleMenuChange = (selectedKey) => {
    setMenuKey(selectedKey);
  };
  return (
    <Layout style={{background: 'none'}}>
      <Header>
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={menuKey} selectedKeys={menuKey}
          onSelect={(e) => handleMenuChange(e.key)}>
          <Menu.Item key="1">Home</Menu.Item>
          <Menu.Item key="2">Calculator</Menu.Item>
          <Menu.Item key="3">To Do List</Menu.Item>
          <Menu.Item key="4">Clock</Menu.Item>
          <Menu.Item key="5">Weather App</Menu.Item>
          <Menu.Item key="6">About App</Menu.Item>

        </Menu>
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 64 }}>
       
          {menuKey === '2' ?
          <><Calculator /></> 
          : 
          menuKey === '3' ?
          <><ToDoList/></>
          :
          menuKey === '4' ?
          <><MainClock/></>
          :
          null}

      
      </Content>
    </Layout>
  );
}

export default App;
