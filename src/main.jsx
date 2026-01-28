import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import store from './store/store.js';
import { Provider } from 'react-redux';
import App from './App.jsx'
import Register from './pages/register.jsx';
import Login from './pages/login.jsx';
// import profile from './pages/profile.jsx';
import Profile from './pages/profile.jsx';
import ShowOrgDetails from './pages/ShowOrgDetails.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/user/login",
    element:<Login/>
  },
  {
    path: "/user/register",
    element: <Register/>
  },
  {
    path: "/user/profile",
    element: <Profile />
  },
  {
    path: "/user/profile/org/:orgId",
    element : <ShowOrgDetails/>
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
)
