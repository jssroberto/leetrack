# backend/core/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProfileSettingsView, RoadmapViewSet, SyncTriggerView

router = DefaultRouter()
router.register(r"roadmap", RoadmapViewSet, basename="roadmap")

urlpatterns = [
    path("", include(router.urls)),
    path("settings/", ProfileSettingsView.as_view(), name="profile-settings"),
    path("sync/", SyncTriggerView.as_view(), name="trigger-sync"),
]
