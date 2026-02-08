import openai
import os 
import google.generativeai as genai
from decouple import config
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.http import HttpResponseRedirect
from .models import InterviewPreference, Question, Answer
from .serializers import InterviewPreferenceSerializer, QuestionSerializer
import re
import random
from django.contrib.auth.models import User

genai.configure(api_key=config('OPENAI_API_KEY', default=''))
# Function to fetch AI-generated questions using Gemini API
# Function to fetch AI-generated questions using Gemini API
# Function to fetch AI-generated questions using Gemini API
def generate_ai_questions(domain, difficulty, interview_type):
    prompt = f"Generate 5 {difficulty} interview questions for {domain} in {interview_type} role."
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)

        # Split the response into lines and keep only non-empty lines
        raw_questions = response.text.strip().split('\n')
        
        # Format the questions: Combine questions with their explanations
        questions = []
        current_question = ""
        for line in raw_questions:
            if line.startswith('1.') or line.startswith('2.') or line.startswith('3.') or line.startswith('4.') or line.startswith('5.'):
                if current_question:
                    questions.append(current_question.strip())
                current_question = line  # Start a new question
            else:
                current_question += " " + line  # Append additional information to the current question

        if current_question:  # Don't forget to add the last question
            questions.append(current_question.strip())
        
        print("Generated Questions:", questions)  # Debugging
        return questions
    except Exception as e:
        print(f"Error fetching questions: {e}")
        return []  # Return an empty list if there's an error
    
# Function to generate feedback based on user answers
# Function to generate feedback and a model answer
# Function to generate feedback based on user answers
def generate_feedback(user_answers, questions):
    try:
        # Initialize the model (assuming you are using a generative model like Gemini)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Initialize a list to store feedback and correct answers for each question
        results = []

        # Loop through each question and user's answer
        for user_answer, question in zip(user_answers, questions):
            # Prompt for feedback generation with grammar, tone check, and areas of improvement
            feedback_prompt = (
                f"Evaluate the user's answer: '{user_answer}' to the question: '{question}'. "
                f"Identify grammatical errors, analyze the tone, and highlight key areas of improvement. "
                f"Provide concise feedback focusing on how the answer can be improved, without repeating the user's entire answer."
            )
            feedback_response = model.generate_content(feedback_prompt)
            feedback = feedback_response.text.strip()

            # Prompt to generate a correct answer for comparison
            answer_prompt = f"Provide a short and correct model answer for the question: '{question}'"
            correct_answer_response = model.generate_content(answer_prompt)
            correct_answer = correct_answer_response.text.strip()

            # Append each result with the question, user answer, correct answer, and feedback
            results.append({
                "question": question,
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "feedback": feedback
            })

        # Return a list of dictionaries containing the question, user's answer, correct answer, and feedback
        return results

    except Exception as e:
        print(f"Error generating feedback: {e}")
        return [{"question": "Error", "user_answer": "", "correct_answer": "Error", "feedback": "Feedback generation failed."}]

# Function to calculate rewards
#  def calculate_reward(self, user_answer, correct_answer):
#         # Simple scoring logic; adjust as necessary
#         if user_answer.lower() == correct_answer.lower():
#             return 10  # Full points for correct answer
#         elif len(user_answer) > 0:
#             return 5  # Partial points for providing an answer
#         return 0  # No points for no answer


def home(request):
    """Redirect to the main app landing page."""
    return HttpResponseRedirect('http://localhost:3000/')  # Modify as needed

# View to handle interview preference creation
class InterviewPreferenceCreate(generics.CreateAPIView):
    queryset = InterviewPreference.objects.all()
    serializer_class = InterviewPreferenceSerializer

# View for generating AI questions directly
class GenerateAIQuestionView(APIView):
    def post(self, request):
        domain = request.data.get('domain')
        difficulty = request.data.get('difficulty')
        interview_type = request.data.get('interview_type')

        if not domain or not difficulty or not interview_type:
            return Response({"error": "Domain, difficulty, and interview type must be provided."}, status=status.HTTP_400_BAD_REQUEST)

        questions = generate_ai_questions(domain, difficulty, interview_type)
        #print("Generated Questions from API:", questions)  # Log questions to verify
        return Response({"questions": questions}, status=status.HTTP_200_OK)

# Feedback View (Generates feedback and score)
# Feedback view using AI for improvements
# Feedback View (Generates feedback and score)
class FeedbackView(APIView):
    def post(self, request):
        user_answer = request.data.get('user_answer')
        question = request.data.get('question')

        # Log received values for debugging
        print(f"Received user_answer: {user_answer}, question: {question}")

        # Validate input: both user_answer and question are required
        if not user_answer or not question:
            return Response({"error": "Both user_answer and question are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate feedback and model answer using AI
        feedback_results = generate_feedback([user_answer], [question])  # Pass in lists to handle multiple questions

        # Check for any errors in the feedback generation
        if not feedback_results or 'feedback' not in feedback_results[0]:
            return Response({"error": "Failed to generate feedback."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Extract correct answer and feedback from the generated result
        correct_answer = feedback_results[0]['correct_answer']
        feedback = feedback_results[0]['feedback']

        # Calculate reward points based on the user's answer
        score = calculate_reward(user_answer, correct_answer)

        # Prepare and return the response
        return Response({
            "feedback": feedback,
            "score": score,
            "correct_answer": correct_answer,  # Return correct answer in the response for user reference
            "message": "Thank you for using our system!"  # Thank you message
        }, status=status.HTTP_200_OK)
    
def calculate_reward(user_answer, correct_answer):
    # Normalize answers for comparison
    normalized_user_answer = user_answer.strip().lower()
    normalized_correct_answer = correct_answer.strip().lower()

    # Initialize score
    score = 0

    # Check for exact match
    if normalized_user_answer == normalized_correct_answer:
        score += 100  # Full points for correct answer
    else:
        # Provide partial credit for completeness
        score += 50  # Base for providing an answer

        # Further checks for qualitative feedback
        if len(normalized_user_answer) > 50:  # Check if the answer is detailed
            score += 10  # Additional points for detail

        # Check if answer contains key terms related to the question
        key_terms = set(normalized_correct_answer.split())
        user_terms = set(normalized_user_answer.split())
        common_terms = key_terms.intersection(user_terms)

        if common_terms:
            score += 20  # Points for including relevant terms

    # Cap score at 100 for simplicity
    return min(score, 100)

class GetCorrectAnswerView(APIView):
    def post(self, request):
        question_text = request.data.get('question')
        
        if not question_text:
            return Response({"error": "Question is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch the correct answer from the database
        try:
            question = Question.objects.get(text=question_text)  # Assuming your Question model has a 'text' field
            correct_answer = question.correct_answer  # Assuming you have a field for the correct answer
        except Question.DoesNotExist:
            return Response({"error": "Question not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"correct_answer": correct_answer}, status=status.HTTP_200_OK)

# View to fetch questions based on user preferences
class GetQuestionsView(APIView):
    def post(self, request):
        domain = request.data.get('domain')
        difficulty = request.data.get('difficulty')
        interview_type = request.data.get('interview_type')

        if not domain or not difficulty or not interview_type:
            return Response({"error": "Domain, difficulty, and interview type must be provided."},
                            status=status.HTTP_400_BAD_REQUEST)

        questions = Question.objects.filter(
            domain=domain,
            difficulty=difficulty,
            interview_type=interview_type
        ).order_by('id')

        if not questions.exists():
            # If no questions found, generate using AI
            questions = generate_ai_questions(domain, difficulty, interview_type)
            return Response({"questions": questions}, status=status.HTTP_200_OK)

        serializer = QuestionSerializer(questions, many=True)
        return Response({"questions": serializer.data}, status=status.HTTP_200_OK)

# View to handle user answer submission
class AnswerView(APIView):
    def post(self, request):
        user_answer = request.data.get('user_answer')
        question_id = request.data.get('question_id')

        # Fetch the question and correct answer from the database
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({"error": "Question not found."}, status=status.HTTP_404_NOT_FOUND)

        correct_answer = question.correct_answer

        # Check if the answer is correct
        is_correct = user_answer.lower() == correct_answer.lower()

        # Store the answer in the Answer model (optional)
        Answer.objects.create(
            question=question,
            user_answer=user_answer,
            correct_answer=correct_answer,
            is_correct=is_correct
        )

        return Response({"is_correct": is_correct}, status=status.HTTP_200_OK)

# View to handle user signup
class SignupView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({"error": "User already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate inputs
        if not username or not password:
            return Response({"error": "Username and password are required."},
                            status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password)
        return Response({"success": "User created successfully."}, status=status.HTTP_201_CREATED)

# View to handle user login
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # Validate inputs
        if not username or not password:
            return Response({"error": "Username and password are required."},
                            status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user is not None:
            return Response({"success": "Login successful."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)


# class DashboardDataView(APIView):
#     def get(self, request):
#         user = request.user
#         user_interviews = Interview.objects.filter(user=user)
#         total_interviews = user_interviews.count()
#         average_score = user_interviews.aggregate(Avg('score'))['score__avg'] or 0
        
#         # Example of gathering recent interviews
#         recent_interviews = user_interviews.order_by('-date')[:5]

#         # Collecting feedback summary (mock example)
#         feedback_summary = {
#             "communication": user_interviews.aggregate(Avg('communication_feedback'))['communication_feedback__avg'] or 0,
#             "technical": user_interviews.aggregate(Avg('technical_feedback'))['technical_feedback__avg'] or 0,
#         }

#         return Response({
#             "total_interviews": total_interviews,
#             "average_score": average_score,
#             "recent_interviews": recent_interviews,
#             "feedback_summary": feedback_summary,
#         })
