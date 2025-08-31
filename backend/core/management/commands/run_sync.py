# backend/core/management/commands/run_sync.py
from django.core.management.base import BaseCommand

from core.models import Profile
from core.services import run_intelligent_sync_for_user


class Command(BaseCommand):
    help = "Runs the intelligent sync for all active users"

    def handle(self, *args, **options):
        # We select profiles that have a cookie and are marked as valid
        active_profiles = Profile.objects.filter(
            encrypted_session_cookie__isnull=False, is_cookie_valid=True
        )

        self.stdout.write(
            f"Starting sync for {active_profiles.count()} active profiles..."
        )

        for profile in active_profiles:
            try:
                run_intelligent_sync_for_user(profile)
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"An unexpected error occurred for user {profile.user.username}: {e}"
                    )
                )

        self.stdout.write(self.style.SUCCESS("Sync process finished."))
