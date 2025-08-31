// src/api/apiClient.js
import axios from "axios";

// Get the base URL from the environment variables we set up
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create a new Axios instance with a custom configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// === Interceptor for adding the JWT token to requests ===
// This is a powerful feature of Axios. Before any request is sent,
// this function will run.
apiClient.interceptors.request.use(
  (config) => {
    // Get the access token from localStorage (we'll save it there after login)
    const token = localStorage.getItem("accessToken");
    if (token) {
      // If the token exists, add it to the Authorization header
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // This will be triggered if there's an error setting up the request
    return Promise.reject(error);
  }
);

// TODO in a later phase: Add an interceptor to handle token refreshing automatically.
// For now, this is a perfect starting point.

export default apiClient;
