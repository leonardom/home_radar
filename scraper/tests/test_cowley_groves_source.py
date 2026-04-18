from scraper.sources.cowley_groves import CowleyGrovesSource

SAMPLE_RESULTS_HTML = """
<li>
  <a href="https://www.cowleygroves.com/property/annex-apartment-high-tilt-douglas-road-kirk-michael-im6-1as">
    <div class="img-holder">
      <img class="holder" src="https://www.cowleygroves.com/images/grid_holder.jpg" />
      <img
        src="https://cowleygroves.s3.eu-west-2.amazonaws.com/images/properties/4046/IMG_5262_grid.jpeg"
      />
    </div>
    <span class="status New Listing">New Listing</span>
    <div>
      <h4>Annex Apartment, High Tilt, Douglas Road, Kirk Michael, IM6 1AS</h4>
      <span class="price">£2,000 <small>Per Calendar Month</small></span>
      <span class="attr bathrooms"><i></i>2<b>Bathrooms</b></span>
      <span class="attr bedrooms"><i></i>2<b>Bedrooms</b></span>
    </div>
  </a>
</li>
"""

SAMPLE_PAGE_HTML = """
<html>
  <body>
    <form id="FilterForm" method="GET" action="sales_update">
      <input type="hidden" name="ajax" value="true" />
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="type" value="sale" />
      <input type="hidden" name="_token" value="test-token" />
      <select name="sort_order">
        <option value="created_at,DESC">Newest</option>
        <option selected value="price,DESC">Price: Highest first</option>
      </select>
    </form>
  </body>
</html>
"""


def test_parse_listings_extracts_expected_fields() -> None:
    source = CowleyGrovesSource()

    listings = source._parse_listings(SAMPLE_RESULTS_HTML, department="lettings")

    assert len(listings) == 1
    listing = listings[0]
    assert listing.source == "cowley_groves"
    assert listing.department == "lettings"
    assert (
        listing.listing_url
        == "https://www.cowleygroves.com/property/annex-apartment-high-tilt-douglas-road-kirk-michael-im6-1as"
    )
    assert listing.title == "Annex Apartment, High Tilt, Douglas Road, Kirk Michael, IM6 1AS"
    assert listing.cover_image_url.endswith("IMG_5262_grid.jpeg")
    assert listing.region == "Kirk Michael"
    assert listing.status == "New Listing"
    assert listing.price_raw == "£2,000 Per Calendar Month"
    assert listing.price_value == 2000.0
    assert listing.price_frequency == "month"
    assert listing.beds == 2
    assert listing.baths == 2


def test_build_request_context_extracts_token_and_action() -> None:
    source = CowleyGrovesSource()

    action_url, payload = source._build_request_context(SAMPLE_PAGE_HTML, department="sales")

    assert action_url == "https://www.cowleygroves.com/sales_update"
    assert payload["_token"] == "test-token"
    assert payload["ajax"] == "true"
    assert payload["res_com"] == "Residential"
    assert payload["sel_rent"] == "Sale"
    assert payload["type"] == "sale"
    assert payload["sort_order"] == "price,DESC"


def test_scrape_iterates_pages_until_empty(monkeypatch) -> None:
    source = CowleyGrovesSource()

    def _fake_fetch_initial_page(client, department):
        return SAMPLE_PAGE_HTML

    pages = {
        ("https://www.cowleygroves.com/sales_update", "1"): SAMPLE_RESULTS_HTML,
        ("https://www.cowleygroves.com/sales_update", "2"): "",
    }

    def _fake_fetch_results_page(client, action_url, payload):
        return pages.get((action_url, payload.get("page", "1")), "")

    monkeypatch.setattr(source, "_fetch_initial_page", _fake_fetch_initial_page)
    monkeypatch.setattr(source, "_fetch_results_page", _fake_fetch_results_page)

    listings = source.scrape(
        departments=["sales"],
        timeout=5.0,
        max_pages=None,
        user_agent="ua",
    )

    assert len(listings) == 1
    assert listings[0].source == "cowley_groves"
    assert listings[0].department == "sales"
