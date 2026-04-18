import httpx

from scraper.sources.dandara import DandaraSource

SAMPLE_RESULTS = [
    {
        "title": "Glenfaba Rise",
        "url": "/new-homes-for-sale/isle-of-man/peel/glenfaba-rise/",
        "simpleaddress": "Peel, Isle of Man",
        "coverimageurl": "/assets/images/glenfaba.jpg",
        "status": "Coming Soon",
        "pricerangeformatted": "Homes from £395,000",
        "bedroomrange": "3-4",
    },
    {
        "title": "Birch Park",
        "url": "/new-homes-for-sale/new-homes-essex/braintree/birch-park/",
        "simpleaddress": "Braintree, Essex",
        "coverimageurl": "/assets/images/birch.jpg",
        "status": "Live",
        "pricerangeformatted": "Homes from £280,000",
        "bedroomrange": "2-5",
    },
]


def test_parse_listings_filters_to_isle_of_man_results() -> None:
    source = DandaraSource()

    listings = source._parse_listings(results=SAMPLE_RESULTS, department="sales")

    assert len(listings) == 1
    listing = listings[0]
    assert listing.source == "dandara"
    assert listing.department == "sales"
    assert (
        listing.listing_url
        == "https://www.dandara.com/new-homes-for-sale/isle-of-man/peel/glenfaba-rise/"
    )
    assert listing.title == "Glenfaba Rise"
    assert listing.cover_image_url == "https://www.dandara.com/assets/images/glenfaba.jpg"
    assert listing.region == "Peel"
    assert listing.status == "Coming Soon"
    assert listing.price_raw == "Homes from £395,000"
    assert listing.price_value == 395000.0
    assert listing.beds == 3


def test_scrape_returns_empty_for_lettings_only() -> None:
    source = DandaraSource()

    listings = source.scrape(
        departments=["lettings"],
        timeout=5,
        max_pages=1,
        user_agent="ua",
    )

    assert listings == []


def test_scrape_returns_empty_when_fetch_fails(monkeypatch) -> None:
    source = DandaraSource()

    def _raise(*_args, **_kwargs):
        raise httpx.HTTPStatusError(
            "forbidden",
            request=httpx.Request("GET", "https://www.dandara.com/"),
            response=httpx.Response(403),
        )

    monkeypatch.setattr(source, "_fetch_results", _raise)

    listings = source.scrape(
        departments=["sales"],
        timeout=5,
        max_pages=1,
        user_agent="ua",
    )

    assert listings == []
