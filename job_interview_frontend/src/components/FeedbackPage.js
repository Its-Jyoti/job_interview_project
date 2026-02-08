import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Feedback.css'; // Custom CSS file

const FeedbackPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userAnswer, question, questions } = location.state || {};
    const [feedback, setFeedback] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [reward, setReward] = useState(0);
    const [error, setError] = useState('');
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(true);

    // Fetch feedback when the page loads
    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_answer: userAnswer, question: question }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch feedback');
                }

                const data = await response.json();
                setFeedback(data.feedback);
                setReward(data.score);
            } catch (error) {
                setError('Error fetching feedback. Please try again.');
            }
        };

        if (userAnswer && question) {
            fetchFeedback();
        }
    }, [userAnswer, question]);

    // Automatically start speaking the feedback when feedback is loaded
    useEffect(() => {
        if (feedback && isSpeaking) {
            handleReadFeedback();
        }
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [feedback, isSpeaking]);

    const handleReadFeedback = () => {
        const utterance = new SpeechSynthesisUtterance(feedback);
        window.speechSynthesis.speak(utterance);
        utterance.onend = () => setIsSpeaking(false);
    };

    const toggleSpeaker = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
        } else {
            handleReadFeedback();
        }
        setIsSpeaking(!isSpeaking);
    };

    // Handle star rating for rewards
    const renderStars = () => {
        const totalStars = 5;
        const filledStars = Math.round((reward / 100) * totalStars);
        return (
            <div className="star-rating">
                {[...Array(totalStars)].map((_, index) => (
                    <span key={index} className={index < filledStars ? 'filled-star' : 'empty-star'}>★</span>
                ))}
            </div>
        );
    };

    // const handleShowCorrectAnswer = async (index) => {
    //     const selectedQuestion = questions[index];
    //     try {
    //         const response = await fetch('http://localhost:8000/api/get-correct-answer/', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ question: selectedQuestion }),
    //         });

    //         if (!response.ok) {
    //             throw new Error('Failed to fetch correct answer');
    //         }

    //         const data = await response.json();
    //         setCorrectAnswer(data.correct_answer);
    //         setSelectedQuestionIndex(index);
    //         setShowCorrectAnswer(true);
    //     } catch (error) {
    //         setError('Error fetching correct answer. Please try again.');
    //     }
    // };

    return (
        <div className="feedback-container">
            <h2>Feedback</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {feedback ? (
                <div>
                    <div className="feedback-header">
                        <h3>Your Feedback</h3>
                        <button className="speaker-button" onClick={toggleSpeaker}>
                            {isSpeaking ? '🔇' : '🔊'}
                        </button>
                    </div>
                    <p>{feedback}</p>
                    <h4>Your Reward</h4>
                    {renderStars()} {/* Render star rating based on score */}
                    <p>Thank you for using our system!</p>

                    {/* <div className="question-buttons">
                        {questions && questions.map((question, index) => (
                            <button key={index} onClick={() => handleShowCorrectAnswer(index)}>
                                Q{index + 1}
                            </button>
                        ))}
                    </div>

                    {showCorrectAnswer && (
                        <div className="correct-answer">
                            <h3>Correct Answer for Question {selectedQuestionIndex + 1}:</h3>
                            <p>{correctAnswer}</p>
                        </div>
                    )} */}
                </div>
            ) : (
                <p>Loading feedback...</p>
            )}
            <button className="back-button" onClick={() => navigate('/questions')}>Back to Questions</button>
        </div>
    );
};

export default FeedbackPage;
