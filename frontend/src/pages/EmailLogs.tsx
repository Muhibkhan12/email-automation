import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Dashboard = () => {
  const [active, setActive] = useState('emaillogs');

  return (
    <div className="h-screen w-full flex overflow-hidden">
      <Sidebar active={active} onSelect={setActive} />
        <h1>Emaillogs</h1>
      <main className="flex-1 h-full overflow-y-auto">
        {/* your page content goes here, based on `active` */}
      </main>
    </div>
  );
};

export default Dashboard;