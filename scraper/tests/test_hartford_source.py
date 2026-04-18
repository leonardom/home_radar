from scraper.sources.hartford import HartfordSource

SAMPLE_HTML = """
<html>
  <body>
    <a class="item anim-1000" href="/property/carrick-villa/">
      <span class="status">Available</span>
      <div class="img-holder">
        <img src="/media/carrick.jpg" alt="Carrick" />
      </div>
      <div class="title_details">
        <h2>Carrick Villa</h2>
        <h4>Douglas</h4>
        <p>Homes from £445,000</p>
      </div>
    </a>

    <a class="item anim-1000" href="/developments/other/">
      <div class="title_details"><h2>Not a property listing</h2></div>
    </a>
  </body>
</html>
"""


def test_parse_listings_extracts_expected_fields() -> None:
    source = HartfordSource()

    listings = source._parse_listings(SAMPLE_HTML, department="sales")

    assert len(listings) == 1
    listing = listings[0]
    assert listing.source == "hartford"
    assert listing.department == "sales"
    assert listing.listing_url == "https://hartford.im/property/carrick-villa/"
    assert listing.title == "Carrick Villa"
    assert listing.cover_image_url == "https://hartford.im/media/carrick.jpg"
    assert listing.region == "Douglas"
    assert listing.status == "Available"
    assert listing.price_raw == "Homes from £445,000"
    assert listing.price_value == 445000.0


def test_parse_listings_returns_empty_for_rent_page_without_items() -> None:
    source = HartfordSource()
    html = "<html><body><h1>No properties</h1></body></html>"

    listings = source._parse_listings(html, department="lettings")

    assert listings == []
