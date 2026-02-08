import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup.jsx';
import FormPage from './components/FormPage';
import InterviewPage from './components/InterviewPage';
import ResultPage from './components/ResultPage';
import QuestionsPage from './components/QuestionsPage';
import FeedbackPage from './components/FeedbackPage'; // Assuming you have a FeedbackPage component
import GenerateQuestion from './components/GenerateQuestion';
import CorrectAnswer from './components/CorrectAnswer';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/form" element={<FormPage />} />
                <Route path="/interview" element={<InterviewPage />} />
                <Route path="/result" element={<ResultPage />} />
                <Route path="/correct-answer" element={<CorrectAnswer />} />
                <Route path="/" element={<Login />} /> // Default route
                <Route path="/generate-question" element={<GenerateQuestion />} /> // This should be properly set up
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/feedback" element={<FeedbackPage />} /> // Ensure FeedbackPage component is implemented
            </Routes>
        </Router>
    );
};

export default App;
