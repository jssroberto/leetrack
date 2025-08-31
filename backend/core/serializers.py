# backend/core/serializers.py
from django.utils import timezone
from rest_framework import serializers

from .models import Problem, Profile, Submission, WeeklyGoal


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


class PledgedProblemSerializer(serializers.ModelSerializer):
    """A simple serializer for problems within a goal."""

    class Meta:
        model = Problem
        fields = ["titleSlug", "title", "difficulty"]


class WeeklyGoalSerializer(serializers.ModelSerializer):
    """
    The main serializer for a weekly goal. It includes the list of pledged problems
    and calculates the user's progress against that list for the week.
    """

    # We'll nest the problem details for easier frontend rendering.
    problems = PledgedProblemSerializer(many=True, read_only=True)

    # This is a list of titleSlugs that the frontend will send when creating/updating a goal.
    problem_slugs = serializers.ListField(
        child=serializers.CharField(), write_only=True
    )

    # This custom field will calculate and add the progress.
    progress = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyGoal
        fields = [
            "id",
            "profile",
            "start_date",
            "problems",
            "problem_slugs",
            "progress",
        ]
        # We don't want the user to manually set the profile or start_date.
        read_only_fields = ["profile", "start_date"]

    def get_progress(self, obj):
        # 'obj' is the WeeklyGoal instance.
        # Get all the "Accepted" submissions for this user for the pledged problems.
        submissions = Submission.objects.filter(
            profile=obj.profile,
            problem__in=obj.problems.all(),
            status="Accepted",
            # Filter for submissions made within the goal's week.
            timestamp__gte=obj.start_date,
            timestamp__lt=obj.start_date + timezone.timedelta(days=7),
        ).values_list("problem__titleSlug", flat=True)

        return {
            "completed_slugs": list(set(submissions)),
            "total_pledged": obj.problems.count(),
        }

    def create(self, validated_data):
        # This logic handles creating and updating the goal's problem list.
        problem_slugs = validated_data.pop("problem_slugs")
        problems = Problem.objects.filter(titleSlug__in=problem_slugs)

        goal = WeeklyGoal.objects.create(**validated_data)
        goal.problems.set(problems)
        return goal

    def update(self, instance, validated_data):
        problem_slugs = validated_data.pop("problem_slugs")
        problems = Problem.objects.filter(titleSlug__in=problem_slugs)

        instance.problems.set(problems)
        return instance
