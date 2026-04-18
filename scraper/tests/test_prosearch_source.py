from scraper.sources.prosearch import ProsearchSource

SAMPLE_HTML = """
<html>
  <body>
    <div class="property-card bg-white card d-flex flex-column flex-md-row">
      <a href="/contact">
        <img src="/static/images/contact.jpg" alt="Get in touch today" />
      </a>
      <div class="card-body">
        <h5 class="card-title">Looking to rent your property?</h5>
      </div>
    </div>

    <div class="property-card card d-flex flex-column flex-md-row">
      <a href="/property/flat-3-pinewood-flats-laburnum-road-douglas-isle-of-man">
        <img src="/static/images/flat.jpg" alt="Flat 3 Pinewood Flats" />
      </a>
      <div class="card-body">
        <h5 class="card-title">Flat 3 Pinewood Flats Laburnum Road Douglas Isle of Man</h5>
        <p class="card-text card-primary fw-bold">
          Price: £1,100 pcm <i class="fa fa-bed"></i> 2
        </p>
        <p class="card-text">Douglas - Two Bed Unfurnished Apartment</p>
        <a
          href="/property/flat-3-pinewood-flats-laburnum-road-douglas-isle-of-man"
          class="btn text-white"
        >
          View Details
        </a>
      </div>
    </div>
  </body>
</html>
"""


def test_parse_listings_extracts_expected_fields() -> None:
    source = ProsearchSource()

    listings = source._parse_listings(SAMPLE_HTML, department="lettings")

    assert len(listings) == 1
    listing = listings[0]
    assert listing.source == "prosearch"
    assert listing.department == "lettings"
    assert (
        listing.listing_url
        == "https://www.prosearch.co.im/property/flat-3-pinewood-flats-laburnum-road-douglas-isle-of-man"
    )
    assert (
        listing.cover_image_url
        == "https://www.prosearch.co.im/static/images/flat.jpg"
    )
    assert listing.title == "Flat 3 Pinewood Flats Laburnum Road Douglas Isle of Man"
    assert listing.region == "Douglas"
    assert listing.status == "TO LET"
    assert listing.price_raw == "Price: £1,100 pcm"
    assert listing.price_value == 1100.0
    assert listing.price_frequency == "month"
    assert listing.beds == 2


def test_scrape_skips_sales_and_returns_empty_when_only_sales_requested() -> None:
    source = ProsearchSource()

    listings = source.scrape(
        departments=["sales"],
        timeout=5,
        max_pages=1,
        user_agent="ua",
    )

    assert listings == []
