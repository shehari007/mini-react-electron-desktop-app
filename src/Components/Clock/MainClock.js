import React from 'react'
import Clock from './SubComponents/Clock'
import CountdownTimer from './SubComponents/CountdownTimer'
import Stopwatch from './SubComponents/Stopwatch'

const MainClock = () => {
  return (
    <>
   <Clock/>
   <CountdownTimer/>
   <Stopwatch/>
   </>
  )
}

export default MainClock
