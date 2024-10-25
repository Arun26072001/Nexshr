import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import PageAndActionAuth from './components/Settings/PageAndActionAuth';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    {/* <PageAndActionAuth /> */}
    <App />
  </BrowserRouter>
);

