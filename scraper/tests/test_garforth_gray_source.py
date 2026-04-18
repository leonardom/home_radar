from scraper.sources.garforth_gray import GarforthGraySource

SAMPLE_HTML = """
<html>
  <body>
    <div data-cursor-text="View Property" class="properties-list-item row g-0">
      <div class="col-md-6 col-xl-7 gallery-property">
        <ul>
          <li>
            <a href="/douglas-quay-west-apartments-6/">
              <div
                class="pic-prop lazyload"
                data-bg="/uploads/thumb4/17-quay-west-apts-1-jpg_001.webp"
              >
                <div class="show-day">Showtime 22/04/26</div>
              </div>
            </a>
          </li>
        </ul>
      </div>
      <div class="col-md-6 col-xl-5">
        <div class="text">
          <a class="text-card-link" href="/douglas-quay-west-apartments-6/">
            <div class="location">Douglas</div>
            <p>Luxury Apartment with Balcony &amp; Parking Space</p>
            <div class="highlights">
              <div class="number">2</div>
              <div class="icon"><img src="/assets/images/icon-bed-white.svg" alt=""></div>
            </div>
            <div class="highlights">
              <div class="number">2</div>
              <div class="icon"><img src="/assets/images/icon-bath-white.svg" alt=""></div>
            </div>
            <div class="highlights">
              <div class="number">1</div>
              <div class="icon"><img src="/assets/images/icon-sofa-white.svg" alt=""></div>
            </div>
          </a>
          <div class="d-flex justify-content-between price-share">
            <div class="price">&pound;325,000</div>
          </div>
        </div>
      </div>
    </div>

    <ul class="pagination">
      <li class="page-item active"><a class="page-link" href="#">1</a></li>
      <li class="page-item"><a class="page-link" href="/sales?page=2">2</a></li>
      <li class="page-item">
        <a class="page-link" href="/sales?page=2"
          ><img src="/assets/images/pagination-next.svg" alt="Next page"
        /></a>
      </li>
    </ul>
  </body>
</html>
"""


def test_parse_listings_extracts_expected_fields() -> None:
    source = GarforthGraySource()
    listings = source._parse_listings(SAMPLE_HTML, department="sales")

    assert len(listings) == 1
    listing = listings[0]
    assert listing.source == "garforth_gray"
    assert listing.department == "sales"
    assert (
        listing.listing_url
        == "https://www.garforthgray.im/douglas-quay-west-apartments-6/"
    )
    assert listing.title == "Luxury Apartment with Balcony & Parking Space"
    assert listing.region == "Douglas"
    assert (
        listing.cover_image_url
        == "https://www.garforthgray.im/uploads/thumb4/17-quay-west-apts-1-jpg_001.webp"
    )
    assert listing.status == "FOR SALE"
    assert listing.price_raw == "£325,000"
    assert listing.price_value == 325000.0
    assert listing.beds == 2
    assert listing.baths == 2
    assert listing.receptions == 1


def test_extract_next_page_number_returns_integer() -> None:
    source = GarforthGraySource()
    assert source._extract_next_page_number(SAMPLE_HTML) == 2


def test_parse_listings_extracts_monthly_frequency_for_lettings() -> None:
  html = SAMPLE_HTML.replace("department=\"sales\"", "department=\"lettings\"")
  html = html.replace("&pound;325,000", "&pound;1,250 / month")

  source = GarforthGraySource()
  listings = source._parse_listings(html, department="lettings")

  assert len(listings) == 1
  assert listings[0].price_frequency == "month"
