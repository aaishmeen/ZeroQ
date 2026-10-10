import os
import pytest

@pytest.fixture(scope="session", autouse=True)
def guard_remote_database():
    url = os.getenv("DATABASE_URL", "")
    if "supabase" in url.lower() or "render" in url.lower() or "pooler" in url.lower():
        pytest.exit(
            "\n=========================================================================\n"
            "UNCONDITIONAL SAFETY GUARD ACTIVATED: Pytest is REFUSING to run against\n"
            "the remote Supabase / production database URL under all circumstances!\n"
            "Remote testing bypasses have been removed. Use an isolated local test DB.\n"
            "=========================================================================\n"
        )
