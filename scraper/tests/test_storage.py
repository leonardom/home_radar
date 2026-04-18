from scraper.models import ListingRecord, ScrapeResult
from scraper.storage import persist_scrape_result


def _build_listing(*, price_raw: str, price_value: float, scraped_at: str) -> ListingRecord:
    return ListingRecord(
        source="deanwood",
        department="sales",
        listing_url="https://deanwood.im/property/example-1/",
        title="Example Street, Douglas",
        cover_image_url="https://cdn.example.com/example-cover.jpg",
        region="Douglas",
        status="For Sale",
        price_raw=price_raw,
        price_value=price_value,
        price_frequency=None,
        beds=2,
        receptions=1,
        baths=1,
        property_type="Terraced",
        scraped_at=scraped_at,
    )


def _build_result(listing: ListingRecord) -> ScrapeResult:
    return ScrapeResult(
        source="deanwood",
        departments=["sales"],
        listing_count=1,
        listings=[listing],
    )


def test_persist_inserts_then_marks_unchanged(tmp_path) -> None:
    db_path = str(tmp_path / "scraper.db")

    first = _build_listing(
        price_raw="£100,000",
        price_value=100000.0,
        scraped_at="2026-01-01T00:00:00Z",
    )
    second = _build_listing(
        price_raw="£100,000",
        price_value=100000.0,
        scraped_at="2026-01-02T00:00:00Z",
    )

    first_stats = persist_scrape_result(_build_result(first), db_path=db_path)
    second_stats = persist_scrape_result(_build_result(second), db_path=db_path)

    assert first_stats.inserted == 1
    assert first_stats.updated == 0
    assert first_stats.unchanged == 0

    assert second_stats.inserted == 0
    assert second_stats.updated == 0
    assert second_stats.unchanged == 1


def test_persist_updates_existing_record_when_hash_changes(tmp_path) -> None:
    db_path = str(tmp_path / "scraper.db")

    original = _build_listing(
        price_raw="£100,000",
        price_value=100000.0,
        scraped_at="2026-01-01T00:00:00Z",
    )
    changed = _build_listing(
        price_raw="£110,000",
        price_value=110000.0,
        scraped_at="2026-01-03T00:00:00Z",
    )

    persist_scrape_result(_build_result(original), db_path=db_path)
    updated_stats = persist_scrape_result(_build_result(changed), db_path=db_path)

    assert updated_stats.inserted == 0
    assert updated_stats.updated == 1
    assert updated_stats.unchanged == 0
