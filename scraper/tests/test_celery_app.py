from scraper import celery_app as celery_module
from scraper.sources import get_sources


def test_beat_schedule_contains_all_sources() -> None:
    schedule = celery_module.celery_app.conf.beat_schedule
    sources = sorted(get_sources().keys())

    for source in sources:
        entry_name = f"scrape-{source}-both"
        assert entry_name in schedule
        entry = schedule[entry_name]
        assert entry["task"] == "scraper.scrape_and_persist"
        assert entry["kwargs"]["source"] == source
        assert entry["kwargs"]["department"] == "both"
        assert entry["kwargs"]["max_pages"] == 1
        assert entry["kwargs"]["all_pages"] is True
        assert "database_url" in entry["kwargs"]


def test_build_beat_schedule_uses_per_source_intervals(monkeypatch) -> None:
    monkeypatch.setattr(celery_module.settings, "beat_interval_minutes", 30)
    monkeypatch.setattr(
        celery_module.settings,
        "beat_source_intervals_minutes",
        {
            "black_grace_cowley": 8,
            "chrystals": 12,
            "cowley_groves": 20,
            "dandara": 11,
            "deanwood": 10,
            "garforth_gray": 45,
            "hartford": 14,
            "grays": 16,
            "manxmove": 120,
            "partners": 15,
            "prosearch": 18,
        },
    )

    schedule = celery_module._build_beat_schedule()

    assert schedule["scrape-black_grace_cowley-both"]["schedule"] == 480.0
    assert schedule["scrape-chrystals-both"]["schedule"] == 720.0
    assert schedule["scrape-cowley_groves-both"]["schedule"] == 1200.0
    assert schedule["scrape-dandara-both"]["schedule"] == 660.0
    assert schedule["scrape-deanwood-both"]["schedule"] == 600.0
    assert schedule["scrape-garforth_gray-both"]["schedule"] == 2700.0
    assert schedule["scrape-hartford-both"]["schedule"] == 840.0
    assert schedule["scrape-grays-both"]["schedule"] == 960.0
    assert schedule["scrape-manxmove-both"]["schedule"] == 7200.0
    assert schedule["scrape-partners-both"]["schedule"] == 900.0
    assert schedule["scrape-prosearch-both"]["schedule"] == 1080.0


def test_source_interval_seconds_falls_back_to_global(monkeypatch) -> None:
    monkeypatch.setattr(celery_module.settings, "beat_interval_minutes", 25)
    monkeypatch.setattr(
        celery_module.settings,
        "beat_source_intervals_minutes",
        {"deanwood": 5},
    )

    assert celery_module._source_interval_seconds("deanwood") == 300.0
    assert celery_module._source_interval_seconds("garforth_gray") == 1500.0
