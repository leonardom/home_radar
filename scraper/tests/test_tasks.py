from dataclasses import dataclass

from scraper.celery_app import celery_app
from scraper.models import ListingRecord, ScrapeResult
from scraper.tasks import run_scrape_job, scrape_and_persist_task


@dataclass(slots=True)
class _DummyPersist:
    inserted: int
    updated: int
    unchanged: int


def _build_listing() -> ListingRecord:
    return ListingRecord(
        source="deanwood",
        department="sales",
        listing_url="https://deanwood.im/property/example-1/",
        title="Example 1",
        cover_image_url="https://cdn.example.com/example-1.jpg",
        region="Douglas",
        status="For Sale",
        price_raw="£100,000",
        price_value=100000.0,
        price_frequency=None,
        beds=2,
        receptions=1,
        baths=1,
        property_type="Terraced",
        scraped_at="2026-01-01T00:00:00+00:00",
    )


def test_run_scrape_job_passes_all_pages_and_persists(monkeypatch, tmp_path) -> None:
    seen_request = {}

    def _fake_run_scrape(request):
        seen_request["source"] = request.source
        seen_request["departments"] = request.departments
        seen_request["max_pages"] = request.max_pages
        seen_request["timeout"] = request.timeout
        return ScrapeResult(
            source=request.source,
            departments=request.departments,
            listing_count=1,
            listings=[_build_listing()],
            scraped_at="2026-01-01T00:00:00+00:00",
        )

    def _fake_persist(result, database_url, db_path):
        assert result.source == "deanwood"
        assert database_url is None
        assert db_path.endswith("jobs.db")
        return _DummyPersist(inserted=1, updated=0, unchanged=0)

    monkeypatch.setattr("scraper.tasks.run_scrape", _fake_run_scrape)
    monkeypatch.setattr("scraper.tasks.persist_scrape_result", _fake_persist)

    payload = run_scrape_job(
        source="deanwood",
        department="both",
        timeout=7.5,
        max_pages=3,
        all_pages=True,
        db_path=str(tmp_path / "jobs.db"),
    )

    assert seen_request == {
        "source": "deanwood",
        "departments": ["sales", "lettings"],
        "max_pages": None,
        "timeout": 7.5,
    }
    assert payload["source"] == "deanwood"
    assert payload["departments"] == ["sales", "lettings"]
    assert payload["listing_count"] == 1
    assert payload["database"]["inserted"] == 1
    assert payload["job"] == {"all_pages": True, "max_pages": None, "timeout": 7.5}


def test_run_scrape_job_rejects_invalid_department() -> None:
    try:
        run_scrape_job(source="deanwood", department="commercial")
    except ValueError as exc:
        assert "department must be one of" in str(exc)
    else:
        raise AssertionError("expected ValueError")


def test_scrape_and_persist_task_runs_in_eager_mode(monkeypatch, tmp_path) -> None:
    def _fake_run_scrape(request):
        return ScrapeResult(
            source=request.source,
            departments=request.departments,
            listing_count=1,
            listings=[_build_listing()],
            scraped_at="2026-01-01T00:00:00+00:00",
        )

    def _fake_persist(result, database_url, db_path):
        assert result.source == "deanwood"
        assert database_url is None
        assert db_path.endswith("jobs.db")
        return _DummyPersist(inserted=1, updated=0, unchanged=0)

    monkeypatch.setattr("scraper.tasks.run_scrape", _fake_run_scrape)
    monkeypatch.setattr("scraper.tasks.persist_scrape_result", _fake_persist)

    previous_always_eager = celery_app.conf.task_always_eager
    previous_store_eager = celery_app.conf.task_store_eager_result
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_store_eager_result = True

    try:
        async_result = scrape_and_persist_task.delay(
            "deanwood",
            department="sales",
            timeout=5.0,
            max_pages=1,
            db_path=str(tmp_path / "jobs.db"),
        )
        payload = async_result.get(timeout=1)
    finally:
        celery_app.conf.task_always_eager = previous_always_eager
        celery_app.conf.task_store_eager_result = previous_store_eager

    assert payload["source"] == "deanwood"
    assert payload["departments"] == ["sales"]
    assert payload["database"]["inserted"] == 1
