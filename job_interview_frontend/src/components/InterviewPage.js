import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './InterviewPage.css'; // Import your CSS file

const InterviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { domain, difficulty, interview_type } = location.state || {};
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false); // State to track if the speaker is active

    const handleStartInterview = () => {
        setLoading(true);
        setError('');

        const payload = {
            domain,
            difficulty,
            interview_type,
        };

        fetch(`${import.meta.env.VITE_API_URL}/api/generate-questions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.questions && data.questions.length > 0) {
                navigate('/questions', { state: { questions: data.questions } });
            } else {
                setError('No questions generated. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            setError('An error occurred: ' + error.message);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    // Function to read the welcome message aloud
    const handleReadWelcomeMessage = () => {
        const message = "Welcome to Our Company! How do you feel? All the best for your interview!";
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
    };

    // Automatically read the welcome message when the component mounts
    useEffect(() => {
        handleReadWelcomeMessage();
        setIsSpeaking(true); // Set speaking state to true when the message is read

        // Stop any speech synthesis when the component unmounts
        return () => {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        };
    }, []);

    // Toggle the speaker on/off
    const toggleSpeaker = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel(); // Stop speaking if it's currently speaking
        } else {
            handleReadWelcomeMessage(); // Read the message again
        }
        setIsSpeaking(!isSpeaking); // Toggle the speaking state
    };

    return (
        <div className="interview-container">
            <h2 className="welcome-message">Welcome to Our Company!</h2>
            <p className="comfort-message">How do you feel? All the best for your interview!</p>
            {error && <p className="error-message">{error}</p>}
            <button className="start-button" onClick={handleStartInterview} disabled={loading}>
                {loading ? 'Fetching Questions...' : 'Start Interview'}
            </button>
            {/* <button className="speaker-button" onClick={toggleSpeaker}> */}
                {/* {isSpeaking ? '🔇 Stop Speaking' : '🔊 Start Speaking'} */}
            {/* </button> */}
        </div>
    );
};

export default InterviewPage;
