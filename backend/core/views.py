# backend/core/views.py
from collections import defaultdict

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Problem, Profile
from .serializers import ProfileSettingsSerializer, RoadmapProblemSerializer
from .services import run_intelligent_sync_for_user  # Import our service


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
        serializer = ProfileSettingsSerializer(request.user.profile)
        return Response(serializer.data)

    def put(self, request):
        profile = request.user.profile
        # For now, we save it directly. Later, we'll add validation and encryption.
        serializer = ProfileSettingsSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            # TODO: Add validation logic here (test the cookie)
            # TODO: Encrypt the cookie before saving
            serializer.save()
            return Response({"status": "Profile settings updated successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
