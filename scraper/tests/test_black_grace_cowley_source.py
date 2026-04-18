from scraper.sources.black_grace_cowley import BlackGraceCowleySource

SAMPLE_HTML = """
<html>
  <body>
    <div class="property d-flex flex-column h-100">
      <div class="property__feature-image">
        <a href="https://www.blackgracecowley.com/property/corris-croft-the-garey-lezayre/">
          <img src="https://www.blackgracecowley.com/wp-content/uploads/2026/03/example.jpg" />
        </a>
        <div class="property__tooltip-holder"></div>
      </div>

      <div class="px-2 py-2">
        <p class="display-4 mb-1 color-primary">£2,100,000</p>
        <h3 class="mb-2 display-4">Corris Croft The Garey, Lezayre</h3>

        <ul class="list-unstyled m-0">
          <li class="property__property-detail">
            <div class="row">
              <div class="col-6"><span>Bedrooms</span></div>
              <div class="col-6 text-right"><span>7</span></div>
            </div>
          </li>
          <li class="property__property-detail">
            <div class="row">
              <div class="col-6"><span>Bathrooms</span></div>
              <div class="col-6 text-right"><span>5</span></div>
            </div>
          </li>
          <li class="property__property-detail">
            <div class="row">
              <div class="col-6"><span>Receptions</span></div>
              <div class="col-6 text-right"><span>4</span></div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div class="property d-flex flex-column h-100">
      <div class="property__feature-image">
        <a href="https://www.blackgracecowley.com/property/high-tilt-annex/">
          <img src="https://www.blackgracecowley.com/wp-content/uploads/2026/04/high-tilt.jpg" />
        </a>
        <div class="property__tooltip-holder">
          <span class="property__tooltip">New Listing</span>
        </div>
      </div>

      <div class="px-2 py-2">
        <p class="display-4 mb-1 color-primary">£2,000 <small>pcm</small></p>
        <h3 class="mb-2 display-4">High Tilt Annex, Douglas Road, Kirk Michael</h3>

        <ul class="list-unstyled m-0">
          <li class="property__property-detail">
            <div class="row">
              <div class="col-6"><span>Bedrooms</span></div>
              <div class="col-6 text-right"><span>2</span></div>
            </div>
          </li>
          <li class="property__property-detail">
            <div class="row">
              <div class="col-6"><span>Bathrooms</span></div>
              <div class="col-6 text-right"><span>2</span></div>
            </div>
          </li>
          <li class="property__property-detail">
            <div class="row">
              <div class="col-6"><span>Receptions</span></div>
              <div class="col-6 text-right"><span>1</span></div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <ul class="pagination justify-content-center">
      <li class="pagination__link">
        <span aria-current="page" class="page-numbers current">1</span>
      </li>
      <li class="pagination__link">
        <a class="page-numbers" href="https://www.blackgracecowley.com/buy-property/page/2/">2</a>
      </li>
      <li class="pagination__link">
        <a class="page-numbers" href="https://www.blackgracecowley.com/buy-property/page/3/">3</a>
      </li>
    </ul>
  </body>
</html>
"""


def test_parse_listings_extracts_expected_fields_for_sales() -> None:
    source = BlackGraceCowleySource()
    listings = source._parse_listings(SAMPLE_HTML, department="sales")

    assert len(listings) == 2

    first = listings[0]
    assert first.source == "black_grace_cowley"
    assert first.department == "sales"
    assert (
        first.listing_url
        == "https://www.blackgracecowley.com/property/corris-croft-the-garey-lezayre/"
    )
    assert first.title == "Corris Croft The Garey, Lezayre"
    assert (
        first.cover_image_url
        == "https://www.blackgracecowley.com/wp-content/uploads/2026/03/example.jpg"
    )
    assert first.region == "Lezayre"
    assert first.status == "FOR SALE"
    assert first.price_raw == "£2,100,000"
    assert first.price_value == 2100000.0
    assert first.price_frequency is None
    assert first.beds == 7
    assert first.baths == 5
    assert first.receptions == 4



def test_parse_listings_extracts_lettings_price_frequency_and_status() -> None:
    source = BlackGraceCowleySource()
    listings = source._parse_listings(SAMPLE_HTML, department="lettings")

    second = listings[1]
    assert second.status == "New Listing"
    assert second.price_raw == "£2,000 pcm"
    assert second.price_value == 2000.0
    assert second.price_frequency == "month"
    assert second.region == "Kirk Michael"



def test_extract_next_page_url_returns_page_two() -> None:
    source = BlackGraceCowleySource()
    assert (
        source._extract_next_page_url(SAMPLE_HTML)
        == "https://www.blackgracecowley.com/buy-property/page/2/"
    )
