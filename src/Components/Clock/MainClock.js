import React from 'react'
import Clock from './SubComponents/Clock'
import CountdownTimer from './SubComponents/CountdownTimer'
import Stopwatch from './SubComponents/Stopwatch'

const MainClock = () => {
  
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
        <Clock />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center', 
          alignItems: 'center',
          marginTop: '15px',
        }}
      >
        <CountdownTimer />
        <div style={{ margin: '0 10px' }}></div>
        <Stopwatch />
      </div>
    </>
  )
}

export default MainClock
