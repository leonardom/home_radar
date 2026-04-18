from scraper.sources.deanwood import DeanwoodSource

SAMPLE_HTML = """
<html>
  <body>
    <div class="card-layout-2 properties-block no-padding fade-up">
      <div class="grid-box">
        <a href="https://deanwood.im/property/example-sale/" title="">
          <div class="grid-box-card">
            <div class="grid-img">
              <span class="property-label label-archive property-label-for-sale">For Sale</span>
              <img src="https://cdn.example.com/sale-cover.jpg" alt="cover">
            </div>
            <div class="grid-content">
              <div class="grid-content-inner">
                <h3 class="property-archive-price">&pound;279,950</h3>
                <div class="feature-info">
                  <div class="property-archive-title">
                    <h4>17 Julian Road, Douglas</h4>
                  </div>
                  <p class="property-single-description">Semi-Detached Bungalow For Sale</p>
                </div>
                <ul class="property-types icons-list">
                  <li>
                    <span>2</span>
                    <span class="bed"></span>
                  </li>
                  <li>
                    <span>1</span>
                    <span class="reception"></span>
                  </li>
                  <li>
                    <span>1</span>
                    <span class="bathrooms"></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>

    <div class="card-layout-2 properties-block no-padding fade-up">
      <div class="grid-box">
        <a href="https://deanwood.im/property/example-letting/" title="">
          <div class="grid-box-card">
            <div class="grid-img">
              <span class="property-label label-archive property-label-to-let">To Let</span>
              <img src="https://cdn.example.com/let-cover.jpg" alt="cover">
            </div>
            <div class="grid-content">
              <div class="grid-content-inner">
                <h3 class="property-archive-price">&pound;950 pcm</h3>
                <div class="feature-info">
                  <div class="property-archive-title">
                    <h4>Flat 3, 1 Harris Terrace, Douglas</h4>
                  </div>
                  <p class="property-single-description">Apartment To Let</p>
                </div>
                <ul class="property-types icons-list">
                  <li>
                    <span>2</span>
                    <span class="bed"></span>
                  </li>
                  <li>
                    <span>1</span>
                    <span class="reception"></span>
                  </li>
                  <li>
                    <span>1</span>
                    <span class="bathrooms"></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>

    <div class="propertyhive-pagination">
      <ul class="page-numbers">
        <li>
          <a class="next page-numbers" href="/search/department/residential-sales/page/2/"
            >&rarr;</a
          >
        </li>
      </ul>
    </div>
  </body>
</html>
"""


def test_parse_listings_extracts_expected_fields() -> None:
    source = DeanwoodSource()
    listings = source._parse_listings(SAMPLE_HTML, department="sales")

    assert len(listings) == 2

    first = listings[0]
    assert first.source == "deanwood"
    assert first.department == "sales"
    assert first.listing_url == "https://deanwood.im/property/example-sale/"
    assert first.title == "17 Julian Road, Douglas"
    assert first.cover_image_url == "https://cdn.example.com/sale-cover.jpg"
    assert first.region == "Douglas"
    assert first.status == "For Sale"
    assert first.price_raw == "£279,950"
    assert first.price_value == 279950.0
    assert first.price_frequency is None
    assert first.beds == 2
    assert first.receptions == 1
    assert first.baths == 1
    assert first.property_type == "Semi-Detached Bungalow"

    second = listings[1]
    assert second.cover_image_url == "https://cdn.example.com/let-cover.jpg"
    assert second.region == "Douglas"
    assert second.price_frequency == "month"
    assert second.property_type == "Apartment"


def test_extract_next_page_returns_absolute_url() -> None:
    source = DeanwoodSource()
    assert (
        source._extract_next_page(SAMPLE_HTML)
        == "https://deanwood.im/search/department/residential-sales/page/2/"
    )
