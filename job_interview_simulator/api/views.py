from openai import OpenAI
from decouple import config

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.http import HttpResponseRedirect

from .models import InterviewPreference, Question, Answer
from .serializers import InterviewPreferenceSerializer, QuestionSerializer

import random
import re


# ==============================
# OpenAI Client
# ==============================
client = OpenAI(
    api_key=config("OPENAI_API_KEY")
)


# ==============================
# AI Question Generator (OpenAI)
# ==============================
def generate_ai_questions(domain, difficulty, interview_type):
    prompt = f"""
    Generate 5 {difficulty} level interview questions for a {interview_type} role
    in the domain: {domain}.

    Format:
    1. Question
    2. Question
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert technical interviewer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        text = response.choices[0].message.content
        questions = [q.strip() for q in text.split("\n") if q.strip()]

        return questions

    except Exception as e:
        print("OpenAI Question Error:", e)
        return []


# ==============================
# AI Feedback Generator
# ==============================
def generate_feedback(user_answers, questions):
    results = []

    try:
        for user_answer, question in zip(user_answers, questions):
            prompt = f"""
            Question: {question}
            User Answer: {user_answer}

            Give concise feedback:
            - grammar
            - clarity
            - correctness
            """

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an interview evaluator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6
            )

            feedback = response.choices[0].message.content.strip()

            correct_answer_prompt = f"Give a short correct answer for: {question}"

            correct_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": correct_answer_prompt}
                ]
            )

            correct_answer = correct_response.choices[0].message.content.strip()

            results.append({
                "question": question,
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "feedback": feedback
            })

        return results

    except Exception as e:
        print("OpenAI Feedback Error:", e)
        return [{
            "question": "",
            "user_answer": "",
            "correct_answer": "",
            "feedback": "Feedback generation failed."
        }]


# ==============================
# Reward Calculation
# ==============================
def calculate_reward(user_answer, correct_answer):
    score = 50
    if user_answer.lower() == correct_answer.lower():
        score = 100
    elif len(user_answer) > 50:
        score += 20
    return min(score, 100)


# ==============================
# Views
# ==============================

def home(request):
    return HttpResponseRedirect("https://job-interview-project-v2.vercel.app/")


class InterviewPreferenceCreate(generics.CreateAPIView):
    queryset = InterviewPreference.objects.all()
    serializer_class = InterviewPreferenceSerializer


class GenerateAIQuestionView(APIView):
    def post(self, request):
        domain = request.data.get("domain")
        difficulty = request.data.get("difficulty")
        interview_type = request.data.get("interview_type")

        if not domain or not difficulty or not interview_type:
            return Response(
                {"error": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        questions = generate_ai_questions(domain, difficulty, interview_type)
        return Response({"questions": questions}, status=status.HTTP_200_OK)


class FeedbackView(APIView):
    def post(self, request):
        user_answer = request.data.get("user_answer")
        question = request.data.get("question")

        if not user_answer or not question:
            return Response(
                {"error": "user_answer and question required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        feedback_data = generate_feedback([user_answer], [question])[0]
        score = calculate_reward(user_answer, feedback_data["correct_answer"])

        return Response({
            "feedback": feedback_data["feedback"],
            "correct_answer": feedback_data["correct_answer"],
            "score": score
        }, status=status.HTTP_200_OK)


class SignupView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Username and password required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "User already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        User.objects.create_user(username=username, password=password)
        return Response({"success": "User created"}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    def post(self, request):
        user = authenticate(
            username=request.data.get("username"),
            password=request.data.get("password")
        )

        if user:
            return Response({"success": "Login successful"}, status=status.HTTP_200_OK)

        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
