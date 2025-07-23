import React from 'react'
import './index.css';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import Home from './screens/Home';
import Signin from './screens/Signin';
import Signup from './screens/Signup';
import App from './App';
import ProtectedRoute from './components/ProtectedRoute';
import Info from './screens/Info';



const router = createBrowserRouter([
    {
      path: "/",
      element: <App />,
      children: [
      { path: "/", element: <Info/> },
      { path: "/info", element: <Info/>},
      { path: "/signin", element: <Signin /> },
      { path: "/signup", element: <Signup />},
      { path: "/home", element:<ProtectedRoute><Home /></ProtectedRoute>  },

      ]
    }
  ]);


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )