import axios from "axios";
// import { API_URL } from "./constant";
import { useDispatch, useSelector } from "react-redux";
import { login, setAccessToken } from "./store/slices/authSlice"
import store from "./store/store";
// Create an Axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// This function gets the current access key (from localStorage or cookies)
function getAccessKey() {
    return store.getState().auth.accessToken || "";
}

// This function saves a new access key
function setAccessKey(key) {
    store.dispatch(setAccessToken(key))
}

// This function refreshes the access key
async function refreshAccessKey() {
    try {
        const refreshKey = store.getState().auth.refreshToken || "";
        await axios.post(
            `${import.meta.env.VITE_API_URL}/users/api/token/refresh/`,
            {
                refresh: refreshKey // <-- correct key name
            },
            {
                headers: {
                    "X-Custom-Domain": window.location.href,
                }
            }
        )
            .then((data) => {
                // console.log("Refresh successful", data);
                const newAccessKey = data.data.access;
                setAccessKey(newAccessKey)
                return newAccessKey;


            })
            .catch((error) => { })
        // const newAccessKey = res.data.accessKey;
        // setAccessKey(newAccessKey);
    } catch (err) {
        // console.error("Refresh failed", err);
        // Redirect to login if needed
        store.dispatch(login({
            isAuthenticated : false
        }))
        window.location.href = "/user/login/";
        throw err;
    }
}

// Request Interceptor → adds headers before each request
api.interceptors.request.use(
    async (config) => {
        // config.headers["X-Custom-Domain"] = window.location.href;
        const token = getAccessKey();
        // console.log("Attaching access token to request:");
        // console.log(token);
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
const forceLogout = () => {
  store.dispatch(
    login({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
    })
  );
  window.location.href = "/user/login/";
};

// Response Interceptor → handles expired key & retries request
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If access key expired & request wasn't retried yet
        if (
            error.response &&
            error.response.status === 401 && // Unauthorized
            !originalRequest._retry
        ) {
            console.log("hhhh")
            forceLogout()
            originalRequest._retry = true;
            const newKey = await refreshAccessKey();
            // console.log("Retrying request with new access token:");
            // console.log(newKey);
            originalRequest.headers["Authorization"] = `Bearer ${newKey}`;
            return api(originalRequest);
        }

        return Promise.reject(error);
    }
);

export default api;
