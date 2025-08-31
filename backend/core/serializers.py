# backend/core/serializers.py
from rest_framework import serializers

from .models import Problem, Profile, Submission


class UserSubmissionStatusSerializer(serializers.ModelSerializer):
    """
    A nested serializer to show a user's specific status on a problem.
    """

    username = serializers.CharField(source="profile.user.username")

    class Meta:
        model = Submission
        fields = ["username", "status", "language", "submission_url"]


class RoadmapProblemSerializer(serializers.ModelSerializer):
    """
    A custom serializer for a Problem on the roadmap.
    It includes the submission statuses for all users in the group.
    """

    # This is a custom field that will call the get_submission_statuses method
    submission_statuses = serializers.SerializerMethodField()

    class Meta:
        model = Problem
        fields = ["titleSlug", "title", "difficulty", "topic", "submission_statuses"]

    def get_submission_statuses(self, obj):
        # 'obj' is the Problem instance.
        # We access the 'view.context' to get the list of profiles for the group.
        profiles = self.context.get("profiles")
        if not profiles:
            return []

        # Find the "Accepted" submission for each profile for the current problem (obj)
        # This is a bit complex but very efficient as it avoids N+1 queries if we use prefetch_related
        statuses = []
        for profile in profiles:
            # Find the submission for this user on this problem
            submission = next(
                (
                    s
                    for s in obj.submissions.all()
                    if s.profile == profile and s.status == "Accepted"
                ),
                None,
            )
            if submission:
                statuses.append(UserSubmissionStatusSerializer(submission).data)
            else:
                # If no submission, provide a default status
                statuses.append(
                    {"username": profile.user.username, "status": "Not Started"}
                )
        return statuses


class ProfileSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for updating a user's profile settings, specifically the cookie.
    """

    class Meta:
        model = Profile
        fields = ["encrypted_session_cookie"]
