from __future__ import annotations

import re

from bs4 import BeautifulSoup


def extract_title(html: str) -> str | None:
    """Extract the page title from HTML."""
    soup = BeautifulSoup(html, "html.parser")
    if soup.title is None or soup.title.string is None:
        return None

    title = soup.title.string.strip()
    return title or None


def normalize_text(value: str) -> str:
    """Collapse repeated whitespace into single spaces and trim the result."""
    return " ".join(value.split())


def parse_price(value: str) -> tuple[str | None, float | None, str | None]:
    """Parse a raw price label into normalized pieces."""
    raw = normalize_text(value)
    if not raw:
        return (None, None, None)

    normalized = raw.replace("\u00a3", "£")
    frequency: str | None = None
    lowered = normalized.lower()
    if "pcm" in lowered:
        frequency = "month"
    elif re.search(r"\bpa\b", lowered):
        frequency = "pa"
    elif "monthly rental" in lowered:
        frequency = "month"
    elif "per calendar month" in lowered:
        frequency = "month"
    elif "per annum" in lowered:
        frequency = "pa"
    elif "/ month" in lowered or "per month" in lowered:
        frequency = "month"

    number_match = re.search(r"([\d,]+(?:\.\d+)?)", normalized)
    if number_match is None:
        return (normalized, None, frequency)

    number = float(number_match.group(1).replace(",", ""))
    return (normalized, number, frequency)
