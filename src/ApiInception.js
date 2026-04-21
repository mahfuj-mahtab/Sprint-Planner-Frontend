import axios from "axios";
import { login, setAccessToken } from "./store/slices/authSlice";
import store from "./store/store";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

function getAccessKey() {
    return store.getState().auth.accessToken || "";
}

function setAccessKey(key) {
    store.dispatch(setAccessToken(key));
}

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

// Tries to get a new access token using the refresh token.
// If refresh fails or refresh token is missing → force logout.
async function refreshAccessKey() {
    const refreshKey = store.getState().auth.refreshToken || "";

    if (!refreshKey) {
        forceLogout();
        throw new Error("No refresh token available");
    }

    try {
        const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/users/api/token/refresh/`,
            { refresh: refreshKey },
            { headers: { "X-Custom-Domain": window.location.href } }
        );

        const newAccessKey = data.access;
        setAccessKey(newAccessKey);
        return newAccessKey;
    } catch (err) {
        // Refresh token is expired or invalid → log the user out
        forceLogout();
        throw err;
    }
}

// ── Request interceptor: attach access token to every request ──────────────
api.interceptors.request.use(
    (config) => {
        const token = getAccessKey();
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: on 401 try refresh once, then retry ──────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry              // prevent infinite retry loop
        ) {
            originalRequest._retry = true;

            // refreshAccessKey() already calls forceLogout() if refresh fails,
            // so we just let the error propagate in that case.
            const newKey = await refreshAccessKey();

            originalRequest.headers["Authorization"] = `Bearer ${newKey}`;
            return api(originalRequest);         // retry the original request
        }

        return Promise.reject(error);
    }
);

export default api;