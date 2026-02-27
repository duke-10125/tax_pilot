import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to include the Supabase JWT in all requests
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

export const getProfile = async () => {
    const response = await api.get('/income/profile');
    return response.data;
};

export const updateProfile = async (data: any) => {
    const response = await api.post('/income/profile', data);
    return response.data;
};

export const uploadSalarySlip = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/ocr/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export default api;
