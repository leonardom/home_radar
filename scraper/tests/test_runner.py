from scraper.models import ListingRecord, ScrapeRequest
from scraper.runner import run_scrape


class _DummySource:
    key = "dummy"
    supported_departments = ("sales",)

    def scrape(self, departments, timeout, max_pages, user_agent):
        assert departments == ["sales"]
        assert timeout == 5.0
        assert max_pages == 2
        assert user_agent == "ua"
        return [
            ListingRecord(
                source="dummy",
                department="sales",
                listing_url="https://example.com/listing/1",
                title="Listing 1",
                cover_image_url="https://cdn.example.com/listing-1.jpg",
                region="Douglas",
                status="FOR SALE",
                price_raw="£100,000",
                price_value=100000.0,
                price_frequency=None,
                beds=2,
                receptions=1,
                baths=1,
                property_type="House",
                scraped_at="2026-01-01T00:00:00+00:00",
            )
        ]


def test_run_scrape_calls_source_and_wraps_result(monkeypatch) -> None:
    monkeypatch.setattr("scraper.runner.get_source", lambda key: _DummySource())
    request = ScrapeRequest(
        source="dummy",
        departments=["sales"],
        timeout=5.0,
        max_pages=2,
        user_agent="ua",
    )

    result = run_scrape(request)

    assert result.source == "dummy"
    assert result.departments == ["sales"]
    assert result.listing_count == 1
    assert result.listings[0].title == "Listing 1"


def test_run_scrape_validates_department_support(monkeypatch) -> None:
    monkeypatch.setattr("scraper.runner.get_source", lambda key: _DummySource())
    request = ScrapeRequest(source="dummy", departments=["lettings"])

    try:
        run_scrape(request)
    except ValueError as exc:
        assert "does not support requested departments" in str(exc)
    else:
        raise AssertionError("expected ValueError")


def test_run_scrape_passes_none_max_pages_for_all_pages(monkeypatch) -> None:
    class _AllPagesSource(_DummySource):
        def scrape(self, departments, timeout, max_pages, user_agent):
            assert max_pages is None
            return []

    monkeypatch.setattr("scraper.runner.get_source", lambda key: _AllPagesSource())
    request = ScrapeRequest(source="dummy", departments=["sales"], max_pages=None)

    result = run_scrape(request)

    assert result.listing_count == 0
