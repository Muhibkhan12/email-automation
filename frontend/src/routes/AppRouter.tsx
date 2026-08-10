import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Sidebar from '../pages/Sidebar'
import { Route, Routes } from 'react-router-dom'

const AppRouter = () => {
  return (
    <Routes>
        <Route path='/dashboard' element={<Dashboard/>} />
    </Routes>
  )
}

export default AppRouter