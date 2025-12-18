import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com', // Placeholder
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for responses (e.g. handle 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle logout or refresh token
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;
