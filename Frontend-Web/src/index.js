import React from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './icons';

// Read the saved theme (default to 'green')
const savedTheme = localStorage.getItem('theme') || 'green';
Array.from(document.body.classList).forEach(cls => {
  if (cls.startsWith('theme-')) document.body.classList.remove(cls);
});
document.body.classList.add(`theme-${savedTheme}`);

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
reportWebVitals();
