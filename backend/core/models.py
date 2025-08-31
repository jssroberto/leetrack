# backend/core/models.py
from django.contrib.auth.models import User
from django.db import models


# Best Practice: Profile model to extend Django's built-in User
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    leetcode_username = models.CharField(max_length=100, unique=True)
    encrypted_session_cookie = models.TextField(blank=True, null=True)
    is_cookie_valid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.username


class Problem(models.Model):
    # The titleSlug is the unique identifier we get from the API
    titleSlug = models.CharField(max_length=255, unique=True, primary_key=True)
    title = models.CharField(max_length=255)

    class Difficulty(models.TextChoices):
        EASY = "Easy", "Easy"
        MEDIUM = "Medium", "Medium"
        HARD = "Hard", "Hard"

    difficulty = models.CharField(max_length=10, choices=Difficulty.choices)
    topic = models.CharField(max_length=100)

    def __str__(self):
        return self.title


class Submission(models.Model):
    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="submissions"
    )
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="submissions"
    )
    timestamp = models.DateTimeField()
    status = models.CharField(max_length=50)  # "Accepted", "Wrong Answer", etc.
    language = models.CharField(max_length=50)
    runtime = models.CharField(max_length=50)
    memory = models.CharField(max_length=50)
    submission_url = models.URLField(max_length=255)

    class Meta:
        # A user can only have one "Accepted" submission per problem
        unique_together = ("profile", "problem", "status")
        ordering = ["-timestamp"]  # Show newest submissions first

    def __str__(self):
        return f"{self.profile.user.username} - {self.problem.title} ({self.status})"


class RoadmapSnapshot(models.Model):
    profile = models.OneToOneField(
        Profile, on_delete=models.CASCADE, related_name="snapshot"
    )
    # JSONField is perfect for storing the list of recent slugs
    snapshot_data = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Snapshot for {self.profile.user.username}"


class WeeklyGoal(models.Model):
    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="weekly_goals"
    )
    # This will always be the Monday of the week for which the goal is set.
    start_date = models.DateField()
    # The list of problems the user commits to solving this week.
    problems = models.ManyToManyField(Problem, related_name="pledged_in_goals")

    class Meta:
        # A user can only have one goal object per week.
        unique_together = ("profile", "start_date")
        ordering = ["-start_date"]

    def __str__(self):
        return f"Goal for {self.profile.user.username} - Week of {self.start_date.strftime('%Y-%m-%d')}"
