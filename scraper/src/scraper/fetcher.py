from __future__ import annotations

import httpx

DEFAULT_TIMEOUT_SECONDS = 10.0
DEFAULT_USER_AGENT = "scraper/0.1.0"


def fetch_html(
    url: str,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    user_agent: str = DEFAULT_USER_AGENT,
) -> str:
    """Fetch HTML content from a URL."""
    headers = {"User-Agent": user_agent}
    with httpx.Client(timeout=timeout, follow_redirects=True, headers=headers) as client:
        response = client.get(url)
        response.raise_for_status()
        return response.text
