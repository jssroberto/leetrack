# backend/core/views.py
from collections import defaultdict
from datetime import timedelta

import requests
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Problem, Profile, WeeklyGoal
from .serializers import (
    RoadmapProblemSerializer,
    WeeklyGoalSerializer,
)
from .services import (  # Import our service
    encryption_service,
    run_intelligent_sync_for_user,
)


def is_leetcode_cookie_valid(session_cookie: str) -> bool:
    """
    Performs a lightweight test API call to check if a session cookie is valid.
    Returns True if valid, False otherwise.
    """
    if not session_cookie:
        return False

    # We can use a simple query to test authentication
    test_query = "query { userStatus { isSignedIn } }"

    s = requests.Session()
    s.cookies.set("LEETCODE_SESSION", session_cookie, domain=".leetcode.com")

    try:
        response = s.post("https://leetcode.com/graphql", json={"query": test_query})
        response.raise_for_status()
        data = response.json()
        # The query returns `isSignedIn: true` for a valid cookie
        return data.get("data", {}).get("userStatus", {}).get("isSignedIn", False)
    except (requests.exceptions.RequestException, KeyError):
        return False


class RoadmapViewSet(viewsets.ReadOnlyModelViewSet):
    """
    The main API endpoint for the LeetCode roadmap.
    It returns all problems, structured by topic, with the submission
    status for all users in the group.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = RoadmapProblemSerializer

    def get_queryset(self):
        # Optimization: Prefetch related submissions to avoid N+1 database queries
        return Problem.objects.prefetch_related("submissions__profile__user").all()

    def list(self, request, *args, **kwargs):
        # For now, we assume a single "group" of all users.
        # In a multi-group app, you would filter this by the user's group.
        profiles = Profile.objects.all()

        queryset = self.get_queryset()

        # We pass the profiles list into the serializer's context
        serializer_context = {"profiles": profiles}
        serializer = self.get_serializer(
            queryset, many=True, context=serializer_context
        )

        # Group the serialized problems by topic
        grouped_data = defaultdict(list)
        for problem_data in serializer.data:
            grouped_data[problem_data["topic"]].append(problem_data)

        return Response(grouped_data)


class ProfileSettingsView(APIView):
    """
    API endpoint for the logged-in user to view and update their settings.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # We need to decrypt the cookie before sending it to the user
        encrypted_cookie = request.user.profile.encrypted_session_cookie
        decrypted_cookie = encryption_service.decrypt(encrypted_cookie)
        return Response({"session_cookie": decrypted_cookie})

    def put(self, request):
        profile = request.user.profile
        # The frontend will send the plain-text cookie
        plain_text_cookie = request.data.get("session_cookie")

        if not plain_text_cookie:
            return Response(
                {"error": "session_cookie field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step 1: Validate the new cookie
        if not is_leetcode_cookie_valid(plain_text_cookie):
            return Response(
                {
                    "error": "The provided LeetCode session cookie is invalid or expired."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step 2: Encrypt the valid cookie
        encrypted_cookie = encryption_service.encrypt(plain_text_cookie)

        # Step 3: Save the encrypted cookie and update the profile status
        profile.encrypted_session_cookie = encrypted_cookie
        profile.is_cookie_valid = True
        profile.save()

        return Response(
            {"status": "LeetCode session cookie updated and validated successfully!"}
        )


class SyncTriggerView(APIView):
    """
    API endpoint to manually trigger a sync for the logged-in user.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        # In a production app, you would run this in a background task (e.g., Celery)
        # For now, we run it directly for simplicity.
        run_intelligent_sync_for_user(profile)
        return Response(
            {"status": "Sync triggered successfully!"}, status=status.HTTP_202_ACCEPTED
        )


class WeeklyGoalView(APIView):
    """
    Endpoint to manage and view weekly goals for the user's team.
    """

    permission_classes = [IsAuthenticated]

    def get_current_week_start(self):
        """Helper to find the date of the most recent Monday."""
        today = timezone.now().date()
        return today - timedelta(days=today.weekday())

    def get(self, request):
        """
        Returns the goals for the current week for all users in the group.
        """
        week_start = self.get_current_week_start()

        # For now, the "group" is all users.
        profiles = Profile.objects.all()
        goals = WeeklyGoal.objects.filter(profile__in=profiles, start_date=week_start)

        serializer = WeeklyGoalSerializer(goals, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Creates or updates the weekly goal for the logged-in user.
        This is an "upsert" operation.
        """
        week_start = self.get_current_week_start()
        profile = request.user.profile

        # get_or_create finds an existing goal or creates a new one.
        goal, created = WeeklyGoal.objects.get_or_create(
            profile=profile, start_date=week_start
        )

        # Use the serializer to update the goal with the data from the request.
        # `partial=True` allows us to not provide all fields.
        serializer = WeeklyGoalSerializer(goal, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(profile=profile, start_date=week_start)  # Pass context
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
