import axios from 'axios';

const apiUrl = `${process.env.REACT_APP_API_URL}/api`;

const axiosInstance = axios.create({
    baseURL:apiUrl,
    withCredentials:true
})

// Add request interceptor to include token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('axiosInstance: token from localStorage=', token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('axiosInstance: Added Authorization header');
        } else {
            console.log('axiosInstance: No token found in localStorage');
        }
        console.log('axiosInstance: withCredentials=', config.withCredentials);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;