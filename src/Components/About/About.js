import React from 'react'
import { Card } from 'antd';
import { HeartTwoTone } from '@ant-design/icons';
const { ipcRenderer } = window.require('electron');

const About = () => {
    const urlToOpenProf = `https://github.com/shehari007`
    const urlToOpenRepos = `https://github.com/shehari007?tab=repositories`
    const urlToOpenElectro = `https://github.com/shehari007/mini-react-electro-app`
   
    const handleLinkClick = (type) => {
        if (type === 'profile'){
        ipcRenderer.send('open-external-link', urlToOpenProf)
        } else if (type === 'project'){
        ipcRenderer.send('open-external-link', urlToOpenElectro)
        } else if (type === 'repos') {
        ipcRenderer.send('open-external-link', urlToOpenRepos)
        } 
      };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '15px',
            }}
        >
            <Card
                bordered={true}
                style={{
                    width: 400,
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                    
                }}
            >
                <div align="center">
                <img src='logo.png' height={150} width={210} alt='logo' /><br/>
                <p><b>Mini 4 in 1 Electro App</b></p>
                <p>v0.1.5<br/><a href='##' onClick={()=>handleLinkClick('project')}>view project here</a></p>
                <p>React App Open Source Project Based On Electron Framework For Desktop Applications</p>
                <p>Made With <HeartTwoTone twoToneColor="red" /> By <a href='##' onClick={()=>handleLinkClick('profile')}>Muhammad Sheharyar Butt</a></p>
                </div>
            </Card>
            <div style={{ margin: '0 10px' }}></div>
            <Card

                bordered={true}
                style={{
                    width: 400,
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                }}
            > <div align="center">
                <img src='github.png' height={250} width={250} alt='logo' />
                <p><b>Author: </b>Muhammad Sheharyar Butt</p>
                <p><b>Profile: </b><a href='##' onClick={()=>handleLinkClick('profile')}>view here</a></p>
                <p><b>Other Projects: </b><a href='##' onClick={()=>handleLinkClick('repos')}>view here</a></p>
               
                </div>
            </Card>
        </div>
    )
}

export default About
