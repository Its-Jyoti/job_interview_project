import React, { useState } from 'react';
import axios from 'axios';

const InterviewPreferenceForm = () => {
    const [domain, setDomain] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [type, setType] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/interview-preference/`, {
                domain,
                difficulty,
                interview_type,
            });
            alert('Interview preference created successfully!');
            // Optionally, reset the form or redirect the user here
        } catch (error) {
            // Log the entire error object for debugging
            console.error(error);
            if (error.response) {
                alert(error.response.data.error || 'Something went wrong with the server');
            } else {
                alert('Network error: ' + error.message);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
            />
            <input
                type="text"
                placeholder="Difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                required
            />
            <input
                type="text"
                placeholder="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
            />
            <button type="submit">Submit</button>
        </form>
    );
};

export default InterviewPreferenceForm; 
