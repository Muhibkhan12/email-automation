import React from 'react'
import Sidebar from './Sidebar'

const Dashboard = () => {
  return (
    <>
    <div className='h-full w-full flex'>
        <Sidebar/>
        <div>
            <h1>Dashboard</h1>
        </div>

    </div>
    </>
  )
}

export default Dashboard