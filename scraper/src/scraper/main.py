from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import asdict

from scraper.models import Department, ScrapeRequest
from scraper.runner import run_scrape
from scraper.sources import get_sources
from scraper.storage import persist_scrape_result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Scrape listings from supported real estate sources."
    )
    parser.add_argument(
        "source",
        choices=sorted(get_sources().keys()),
        help="Source key to scrape",
    )
    parser.add_argument(
        "--department",
        choices=["sales", "lettings", "both"],
        default="both",
        help="Listing department filter (default: both)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=10.0,
        help="Request timeout in seconds (default: 10)",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=1,
        help="Maximum pages per department to scrape (default: 1)",
    )
    parser.add_argument(
        "--all-pages",
        action="store_true",
        help="Scrape all available pages for selected departments",
    )
    parser.add_argument(
        "--json",
        dest="json_output",
        action="store_true",
        help="Output structured result as JSON",
    )
    parser.add_argument(
        "--db-url",
        default=None,
        help=(
            "Database URL (e.g. postgresql+psycopg://user:pass@host/db). "
            "If omitted, SCRAPER_DATABASE_URL or --db-path SQLite fallback is used"
        ),
    )
    parser.add_argument(
        "--db-path",
        default="scraper.db",
        help="SQLite database path fallback when --db-url is not set (default: scraper.db)",
    )
    return parser


def resolve_departments(choice: str) -> list[Department]:
    if choice == "sales":
        return ["sales"]
    if choice == "lettings":
        return ["lettings"]
    return ["sales", "lettings"]


def main() -> int:
    args = build_parser().parse_args()
    if args.max_pages < 1:
        print("--max-pages must be >= 1", file=sys.stderr)
        return 2

    effective_max_pages: int | None = None if args.all_pages else args.max_pages

    request = ScrapeRequest(
        source=args.source,
        departments=resolve_departments(args.department),
        timeout=args.timeout,
        max_pages=effective_max_pages,
    )

    try:
        result = run_scrape(request)
    except Exception as exc:
        print(f"scrape failed: {exc}", file=sys.stderr)
        return 1

    try:
        resolved_db_url = args.db_url or os.getenv("SCRAPER_DATABASE_URL")
        persist_stats = persist_scrape_result(
            result=result,
            database_url=resolved_db_url,
            db_path=args.db_path,
        )
    except Exception as exc:
        print(f"database persistence failed: {exc}", file=sys.stderr)
        return 1

    database_info = {
        "url": args.db_url or os.getenv("SCRAPER_DATABASE_URL"),
        "path": args.db_path,
        "inserted": persist_stats.inserted,
        "updated": persist_stats.updated,
        "unchanged": persist_stats.unchanged,
    }

    payload = {
        "source": result.source,
        "departments": result.departments,
        "listing_count": result.listing_count,
        "scraped_at": result.scraped_at,
        "database": database_info,
        "listings": [asdict(listing) for listing in result.listings],
    }

    if args.json_output:
        print(json.dumps(payload, ensure_ascii=False))
    else:
        print(
            f"{payload['source']}: {payload['listing_count']} listings "
            f"({', '.join(payload['departments'])})"
        )
        db_info = payload["database"]
        db_target = db_info["url"] or db_info["path"]
        print(
            "database: "
            f"{db_target} "
            f"(inserted={db_info['inserted']}, "
            f"updated={db_info['updated']}, "
            f"unchanged={db_info['unchanged']})"
        )
        for listing in payload["listings"]:
            price = listing["price_raw"] or "Price unavailable"
            title = listing["title"] or "Untitled"
            print(f"- [{listing['department']}] {title} | {price} | {listing['listing_url']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
