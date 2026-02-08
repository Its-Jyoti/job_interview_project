import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './QuestionsPage.css'; // Import your CSS file

const QuestionsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { questions } = location.state || [];
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');

    const { transcript, resetTranscript } = useSpeechRecognition();

    // Check if questions are present
    if (!questions.length) {
        return <p style={{ color: 'red' }}>No questions found!</p>;
    }

    const header = questions[0]; // First question is the header
    const formattedQuestions = questions.slice(1); // Remaining questions

    const handleNextQuestion = () => {
        if (currentQuestionIndex < formattedQuestions.length - 1) {
            setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
            setUserAnswer(''); // Clear answer when moving to the next question
            resetTranscript(); // Reset transcript when moving to the next question
        } else {
            alert('You have reached the end of the questions.');
        }
    };

    const handleSubmit = async () => {
        if (!userAnswer) {
            alert("Please provide an answer before submitting.");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_answer: userAnswer,
                    question: formattedQuestions[currentQuestionIndex],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get feedback');
            }

            const data = await response.json();

            // Redirect to Feedback page with user answer and question
            navigate('/feedback', {
                state: { userAnswer, question: formattedQuestions[currentQuestionIndex] },
            });

        } catch (error) {
            console.error('Error fetching feedback:', error);
            setError('Error fetching feedback. Please try again.'); // Display error message
        }
    };

    const handleVoiceRecognition = () => {
        if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
            alert("Sorry, your browser does not support speech recognition.");
            return;
        }

        if (isListening) {
            SpeechRecognition.stopListening(); // Stop listening when already listening
            setUserAnswer(transcript); // Set user answer from transcript
            resetTranscript(); // Reset transcript for future use
        } else {
            SpeechRecognition.startListening({ continuous: true }); // Start listening
        }
        setIsListening(!isListening); // Toggle listening state
    };

    const handleReadQuestion = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel(); // Stop the reading if it's already happening
            setIsSpeaking(false);
        } else {
            const utterance = new SpeechSynthesisUtterance(formattedQuestions[currentQuestionIndex]);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false); // Reset speaking state once finished
        }
    };

    return (
        <div className="questions-page">
            <h1 className="header-title">Interview </h1>
            <h2 className="question-header">{header}</h2>
            <h3 className="current-question">{formattedQuestions[currentQuestionIndex]}</h3>
            <textarea
                className="answer-input"
                placeholder="Type your answer..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
            />
            <div className="button-container">
                <button className="primary-btn" onClick={handleNextQuestion} disabled={currentQuestionIndex >= formattedQuestions.length - 1}>
                    Next Question
                </button>
                <button className="submit-btn" onClick={handleSubmit}>Submit</button>
                <button className="mic-btn" onClick={handleVoiceRecognition}>
                    {isListening ? '🎙️ Stop ' : '🎙️ Start '}
                </button>
                <button className="speaker-btn" onClick={handleReadQuestion}>
                    {isSpeaking ? '🔇 ' : '🔊 '}
                </button>
            </div>
            <p className="question-counter">
                Question {currentQuestionIndex + 1} of {formattedQuestions.length}
            </p>
        </div>
    );
};

export default QuestionsPage;
