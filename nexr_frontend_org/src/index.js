import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import AdminOrganizations from './components/superAdmin/AdminOrganizations';
import AdminDashboard from './components/superAdmin/AdminDashboard';
import LandingPage from "./components/LandingPage";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    {/* <LandingPage /> */}
    <App />
    {/* <AdminDashboard organizations={[]} /> */}
    {/* <SkeletonLoader /> */}
  </BrowserRouter>
);
