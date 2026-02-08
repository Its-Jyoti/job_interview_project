// src/api.js

import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/`;

export const createInterviewPreference = async (preferenceData) => {
    try {
        const response = await axios.post(`${API_URL}interview-preference/`, preferenceData);
        return response.data;
    } catch (error) {
        console.error("Error creating interview preference:", error);
        throw error;
    }
};

export const generateInterviewQuestions = async (prompt) => {
    try {
        const response = await axios.post(`${API_URL}generate/`, { prompt });
        return response.data;
    } catch (error) {
        console.error("Error generating questions:", error);
        throw error;
    }
};

export const userSignup = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}signup/`, userData);
        return response.data;
    } catch (error) {
        console.error("Error signing up user:", error);
        throw error;
    }
};

export const userLogin = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}login/`, userData);
        return response.data;
    } catch (error) {
        console.error("Error logging in user:", error);
        throw error;
    }
};  

