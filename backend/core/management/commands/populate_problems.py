import json

from django.conf import settings
from django.core.management.base import BaseCommand

from core.models import Problem


class Command(BaseCommand):
    help = "Populates the database with problems from a JSON file"

    def handle(self, *args, **options):
        # Construct the path to the JSON file relative to the BASE_DIR
        file_path = settings.BASE_DIR / "neetcode150.json"

        self.stdout.write(f"Loading problems from {file_path}...")

        try:
            with open(file_path, "r") as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        problems_created = 0
        problems_updated = 0

        for topic_data in data:
            topic_name = topic_data["topic"]
            for problem_data in topic_data["problems"]:
                slug = problem_data["titleSlug"]

                # Use update_or_create to avoid duplicates
                problem, created = Problem.objects.update_or_create(
                    titleSlug=slug,
                    defaults={
                        "title": problem_data["title"],
                        "difficulty": problem_data["difficulty"],
                        "topic": topic_name,
                    },
                )

                if created:
                    problems_created += 1
                else:
                    problems_updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully populated database. "
                f"Created: {problems_created}, Updated: {problems_updated}."
            )
        )
