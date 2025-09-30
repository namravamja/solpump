import { Rocket } from 'lucide-react'
import React from 'react'
import RocketWithExhaust from './Rocket/Rocket'

const RocketEffect = () => {
  return (
    <div className='relative h-full w-full flex justify-center items-center'>

    <div className='absolute inset-0'>
      <video src="/floor.mp4" autoPlay loop muted playsInline></video>
    </div>
    <div className='relative w-[100vh] h-[100vh] border-2 bg-transparent  flex justify-center items-center'>
      <RocketWithExhaust />
    </div>
    </div>
  )
}

export default RocketEffect