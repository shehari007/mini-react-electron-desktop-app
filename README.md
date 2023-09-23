

<div align="center">
  <a href="https://choosealicense.com/licenses/mit/">
    <img src="https://img.shields.io/badge/LICENSE-MIT-blue?style=flat-square" alt="MIT License">
  </a>
  
  <img src="https://img.shields.io/badge/BUILD-PASSING-green?style=flat-square" alt="Build Passing">
</div>

<br/>


<div align="center">
    <img src="https://github.com/shehari007/mini-react-electron-desktop-app/blob/main/public/logo.png?raw=true" height="250px" width="320px">
</div>




# MINI 4 in 1 REACT ELECTRON APP FOR DESKTOP

A clean & elegant design using Ant Design components, a sleek 4 in 1 mini react app based on electron framework. This app include Calculator, Todo List, Clock, Weather App in single distribution.


## Tech Stack

**CLIENT:** React, Hooks, Ant Design 5+, Electron, Node

**OPEN API:** Weather App Details from -> (https://openweathermap.org/api)


## Features

- Clean Modern design language
- Calculator with keyboard input to perform operations
- Persistent Storage of Todo List so user can save progress on closing app.
- Countdown Timer Alert
- Simple Elegant StopWatch
- Weather App Settings are persistent and have option to save API-KEY and Default city to save Locally
- Can be build for Windows, Linux, MacOS and also deoplyable as a website.

## Screenshots

<details>
  <summary>See SS here.</summary>
  <div align="center">
  <h4>Home Page View</h4>
  <img src="https://github.com/shehari007/mini-react-electron-desktop-app/blob/main/screenshots/miniapp%20(1).png?raw=true" name="image-1">
  <h4>Calculator View</h4>
  <img src="https://github.com/shehari007/mini-react-electron-desktop-app/blob/main/screenshots/miniapp%20(2).png?raw=true" name="image-2">
  <h4>Todo List View</h4>
  <img src="https://github.com/shehari007/mini-react-electron-desktop-app/blob/main/screenshots/miniapp%20(3).png?raw=true" name="image-3">
  <h4>Clock App View</h4>
  <img src="https://github.com/shehari007/mini-react-electron-desktop-app/blob/main/screenshots/miniapp%20(4).png?raw=true" name="image-4">
    <h4>Weather App View</h4>
  <img src="https://github.com/shehari007/mini-react-electron-desktop-app/blob/main/screenshots/miniapp%20(5).png?raw=true" name="image-5">
    <h4>Weather Search View</h4>
  <img src="https://github.com/shehari007/mini-react-electron-desktop-app/blob/main/screenshots/miniapp%20(6).png?raw=true" name="image-6">
      <h4>About View</h4>
  <img src="https://github.com/shehari007/mini-react-electron-desktop-app/blob/main/screenshots/miniapp%20(7).png?raw=true" name="image-7">
  </div>
</details>

## Pre Requirements For Local Development

- React 18+
- Node, NPM
- Python with pip
- API-KEY from (https://openweathermap.org/api) for weather component to work
- VSCODE With ES6+ Module
## Installation

Clone the project

```bash
  git clone https://github.com/shehari007/mini-react-electron-desktop-app.git
```

Go to the project directory

```bash
cd mini-react-electron-desktop-app
```

Install dependencies

```bash
npm install
```

Start the Electron Project in Windows

```bash
npm run electron:start
```
Project will open in window mode not in browser as normal react app would, Happy Hacking!
## Deployment

Deployment is never been easy before, package.json is already configured for every platform (Window, Linux, MacOs, Web). Just need to run build commands for each platform as follows:
## For Windows
```bash
npm run electron:package:win
```
## For Linux
```bash
npm run electron:package:linux
```
## For MacOS
```bash
npm run electron:package:mac
```
## For Website
```bash
npm run build
```
Running these commands will give you a package file (Windows->NSIS .exe) || (Linux->.deb) || (macOS->.dmg) || for wesbite you will get the build folder where you can serve the wesbite using:

```bash
npm install -g serve
serve -s build
```
## Demo Website Link

<a href="https://electron4in1-web-preview.vercel.app/" target="_blank" rel="noreferrer"> Web Preview Here </a>
_This is just a preview of app, data will not save and lost if tab is closed or menu is changed!_

## Demo Windows Setup

Latest release is available for desktop users to test and use the electron application, check out the latest release section and download the application for Windows x64


## !!IMPORTANT NOTE!!

- For this specific app NODE core components enabled & contextIsolation are disabled which is not recommended due to security concerns. However there is no problem with this app as its not used for web browsing and also "CSP inline-scripts" policy is enabled so user can use it with confidence.

- If you enable the preload.js and disabled the node core components the persistent storage wont work.


## License

[MIT](https://choosealicense.com/licenses/mit/)


## Feedback

If you have any feedback, please reach out at shehariyar@gmail.com
dont't forget to give us a star if you like this project.
