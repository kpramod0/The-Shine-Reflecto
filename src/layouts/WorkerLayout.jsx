import React from 'react';
import { Outlet } from 'react-router-dom';
import WorkerNavbar from '../components/worker/WorkerNavbar';
import WorkerBottomNav from '../components/worker/WorkerBottomNav';
import './WorkerLayout.css';

export default function WorkerLayout() {
  return (
    <div className="worker-layout">
      <WorkerNavbar />
      <main className="worker-content">
        <Outlet />
      </main>
      <WorkerBottomNav />
    </div>
  );
}
