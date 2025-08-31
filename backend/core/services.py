# backend/core/services.py
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import pytz
import requests

from .models import Problem, Profile, RoadmapSnapshot, Submission

LEETCODE_API_ENDPOINT = "https://leetcode.com/graphql"

LIGHTWEIGHT_QUERY = """
query recentAcSubmissionList($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    statusDisplay
    timestamp
    lang
    runtime
    memory
    url
  }
}
"""

HEAVY_QUERY = """
query submissionList($offset: Int!, $limit: Int!) {
    submissionList(offset: $offset, limit: $limit) {
        hasNext
        submissions {
            titleSlug
            statusDisplay
            timestamp
            lang
            runtime
            memory
            url
        }
    }
}
"""


def fetch_recent_submissions(username: str) -> List[Dict[str, Any]]:
    """
    Performs the fast, unauthenticated fetch of the 20 most recent accepted submissions.
    Returns a list of submission dictionaries, or an empty list on failure.
    """
    json_payload = {
        "query": LIGHTWEIGHT_QUERY,
        "variables": {"username": username, "limit": 20},
    }
    try:
        response = requests.post(LEETCODE_API_ENDPOINT, json=json_payload)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
        data = response.json()
        if "errors" in data:
            print(f"GraphQL error for {username}: {data['errors'][0]['message']}")
            return []
        return data.get("data", {}).get("recentAcSubmissionList", [])
    except requests.exceptions.RequestException as e:
        print(f"Error fetching recent submissions for {username}: {e}")
        return []


def fetch_full_history(session_cookie: str) -> Optional[List[Dict[str, Any]]]:
    """
    Performs the slow, authenticated fetch of all submissions using a session cookie.
    Returns a list of all submission dictionaries, or an empty list on failure.
    This is a "heavy" operation and should be used sparingly.
    """
    if not session_cookie:
        return []

    s = requests.Session()
    s.cookies.set("LEETCODE_SESSION", session_cookie, domain=".leetcode.com")

    all_submissions = []
    offset = 0
    limit = 20
    has_next_page = True

    while has_next_page:
        json_payload = {
            "query": HEAVY_QUERY,
            "variables": {"offset": offset, "limit": limit},
        }
        try:
            response = s.post(LEETCODE_API_ENDPOINT, json=json_payload)
            response.raise_for_status()
            data = response.json()
            if "errors" in data:
                # This is the key check for an expired cookie
                if "Authentication required" in data["errors"][0]["message"]:
                    print(
                        "Authentication error: The session cookie is likely invalid or expired."
                    )
                    # We return a specific value to signal the auth failure
                    return None
                else:
                    print(
                        f"GraphQL error during full history fetch: {data['errors'][0]['message']}"
                    )
                    return []

            submission_list_data = data.get("data", {}).get("submissionList", {})
            submissions_on_page = submission_list_data.get("submissions", [])

            if not submissions_on_page:
                break

            all_submissions.extend(submissions_on_page)
            has_next_page = submission_list_data.get("hasNext", False)
            offset += limit
            time.sleep(1)  # Be a good API citizen
        except requests.exceptions.RequestException as e:
            print(f"Error fetching full history: {e}")
            return []

    return all_submissions


# backend/core/services.py (add this at the bottom)


def run_intelligent_sync_for_user(profile: Profile):
    """
    Orchestrates the intelligent sync logic for a single user.
    """
    print(f"--- Running sync for user: {profile.user.username} ---")

    # Step 1: Fetch the "Recent 20"
    current_submissions = fetch_recent_submissions(profile.leetcode_username)
    if not current_submissions:
        print("Could not fetch recent submissions. Skipping sync.")
        return

    current_slugs = [sub["titleSlug"] for sub in current_submissions]

    # Step 2: Compare with our stored snapshot
    snapshot, _ = RoadmapSnapshot.objects.get_or_create(profile=profile)
    snapshot_slugs = snapshot.snapshot_data

    if current_slugs == snapshot_slugs:
        print("No new submissions detected. Sync complete.")
        return

    # Step 3: The Decision Tree
    new_slugs = [slug for slug in current_slugs if slug not in snapshot_slugs]

    # Case 2: Clean Append. The most common case.
    if snapshot_slugs and all(slug in current_slugs for slug in snapshot_slugs[:5]):
        print(
            f"Found {len(new_slugs)} new submission(s). Performing lightweight update."
        )

        # Get Problem objects for the new slugs
        problems = Problem.objects.filter(titleSlug__in=new_slugs)
        problem_map = {p.titleSlug: p for p in problems}

        new_submission_objects = []
        for sub_data in current_submissions:
            if (
                sub_data["titleSlug"] in new_slugs
                and sub_data["statusDisplay"] == "Accepted"
            ):
                if sub_data["titleSlug"] in problem_map:
                    new_submission_objects.append(
                        Submission(
                            profile=profile,
                            problem=problem_map[sub_data["titleSlug"]],
                            timestamp=datetime.fromtimestamp(
                                int(sub_data["timestamp"]), tz=pytz.UTC
                            ),
                            status=sub_data["statusDisplay"],
                            language=sub_data["lang"],
                            runtime=sub_data["runtime"],
                            memory=sub_data["memory"],
                            submission_url=f"https://leetcode.com{sub_data['url']}",
                        )
                    )

        # Use bulk_create for efficiency. `ignore_conflicts=True` prevents errors
        # if we try to add a submission that already exists due to our unique_together constraint.
        Submission.objects.bulk_create(new_submission_objects, ignore_conflicts=True)
        snapshot.snapshot_data = current_slugs
        snapshot.save()
        print("Lightweight update complete.")
        return

    # Case 3: Desync or Initial Sync. Trigger the heavy request.
    print("Desync detected or initial sync. Performing full history fetch.")

    # TODO: In a real app, you would decrypt this cookie before using it.
    # For now, we use it directly.
    if not profile.encrypted_session_cookie:
        print(
            f"No session cookie available for {profile.user.username}. Cannot perform full sync."
        )
        return

    full_history = fetch_full_history(profile.encrypted_session_cookie)

    if full_history is None:  # This is our specific signal for auth failure
        print(
            f"Authentication failed for {profile.user.username}. Invalidating cookie."
        )
        profile.is_cookie_valid = False
        profile.save()
        return

    if not full_history:
        print("Full history fetch failed for other reasons. Skipping.")
        return

    # Logic to find submissions that are in the full history but not in our DB
    existing_subs = set(
        Submission.objects.filter(profile=profile, status="Accepted").values_list(
            "problem__titleSlug", flat=True
        )
    )
    all_problems_map = {p.titleSlug: p for p in Problem.objects.all()}

    subs_to_create = []
    for sub_data in full_history:
        slug = sub_data["titleSlug"]
        if (
            sub_data["statusDisplay"] == "Accepted"
            and slug not in existing_subs
            and slug in all_problems_map
        ):
            subs_to_create.append(
                Submission(
                    profile=profile,
                    problem=all_problems_map[slug],
                    timestamp=datetime.fromtimestamp(
                        int(sub_data["timestamp"]), tz=pytz.UTC
                    ),
                    status=sub_data["statusDisplay"],
                    language=sub_data["lang"],
                    runtime=sub_data["runtime"],
                    memory=sub_data["memory"],
                    submission_url=f"https://leetcode.com{sub_data['url']}",
                )
            )
            # Add to existing_subs set to handle multiple 'Accepted' submissions for the same problem in the history
            existing_subs.add(slug)

    if subs_to_create:
        print(
            f"Found {len(subs_to_create)} new unique problems to add from full history."
        )
        Submission.objects.bulk_create(subs_to_create, ignore_conflicts=True)
    else:
        print("No new problems to add from full history. Database is up to date.")

    # Update the snapshot to the latest state
    snapshot.snapshot_data = current_slugs
    snapshot.save()
    print("Full history sync complete.")
