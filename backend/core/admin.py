# backend/core/admin.py
from django.contrib import admin

from .models import Problem, Profile, RoadmapSnapshot, Submission, WeeklyGoal

admin.site.register(Profile)
admin.site.register(Problem)
admin.site.register(Submission)
admin.site.register(RoadmapSnapshot)
admin.site.register(WeeklyGoal)
