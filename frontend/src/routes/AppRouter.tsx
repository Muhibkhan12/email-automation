import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";

import React from 'react'

const AppRouter = () => {
  return (
    <Routes>
        <Route path="/" element={<Dashboard/>} />
    </Routes>
  )
}

export default AppRouter