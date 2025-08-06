import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Info from "./screens/Info";
import Signin from "./screens/Signin";
import Signup from "./screens/Signup";
import Home from "./screens/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Info /> },
      { path: "/info", element: <Info /> },
      { path: "/signin", element: <Signin /> },
      { path: "/signup", element: <Signup /> },
      {
        path: "/home",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        )
      }
    ]
  }
]);

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
