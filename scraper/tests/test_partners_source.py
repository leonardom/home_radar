from scraper.sources.partners import PartnersSource

SAMPLE_HTML = """
<html>
  <head>
    <link href="https://www.partners.co.im/property-for-sale?page=2" rel="next" />
  </head>
  <body>
    <div class="card card--grid" data-id="657742">
      <div class="card__wrapper">
        <div class="card__container">
          <a href="/property/example-sale" class="card__inner">
            <div class="card__image">
              <img data-src="https://calpa.upcloudobjects.com/files/property/462/image/1.jpg" />
            </div>
            <div class="card__content">
              <div class="d-flex align-items-start justify-content-between">
                <span class="card__title">Derby Road, Douglas, IM2</span>
                <div class="card__info">
                  <div class="card__info__item">
                    <i class="fa-light fa-bed-front"></i>
                    <span class="number">4</span>
                  </div>
                  <div class="card__info__item">
                    <i class="fa-light fa-bath"></i>
                    <span class="number">3</span>
                  </div>
                  <div class="card__info__item">
                    <svg class="reception"></svg>
                    <span class="number">2</span>
                  </div>
                </div>
              </div>
              <span class="card__price">
                <span class="priceText">Offers in Region of</span>
                <span class="price-value"> £675,000</span>
              </span>
            </div>
          </a>
        </div>
      </div>
    </div>

    <div class="card card--grid" data-id="708283">
      <a href="/property/example-letting" class="card__inner">
        <div class="card__image">
          <img data-src="https://calpa.upcloudobjects.com/files/property/462/image/2.jpg" />
          <div class="displayStatus"><span>Let Agreed</span></div>
        </div>
        <div class="card__content">
          <span class="card__title">High Tilt Annex, Douglas Road, Kirk Michael</span>
          <div class="card__info">
            <div class="card__info__item">
              <i class="fa-light fa-bed-front"></i>
              <span class="number">2</span>
            </div>
            <div class="card__info__item">
              <i class="fa-light fa-bath"></i>
              <span class="number">2</span>
            </div>
            <div class="card__info__item">
              <svg class="reception"></svg>
              <span class="number">1</span>
            </div>
          </div>
          <span class="card__price"><span class="price-value"> £2,000 pcm</span></span>
        </div>
      </a>
    </div>
  </body>
</html>
"""


def test_parse_listings_extracts_expected_fields_for_sales() -> None:
    source = PartnersSource()
    listings = source._parse_listings(SAMPLE_HTML, department="sales")

    assert len(listings) == 2

    first = listings[0]
    assert first.source == "partners"
    assert first.department == "sales"
    assert first.listing_url == "https://www.partners.co.im/property/example-sale"
    assert first.title == "Derby Road, Douglas, IM2"
    assert (
        first.cover_image_url
        == "https://calpa.upcloudobjects.com/files/property/462/image/1.jpg"
    )
    assert first.region == "Douglas"
    assert first.status == "FOR SALE"
    assert first.price_raw == "Offers in Region of £675,000"
    assert first.price_value == 675000.0
    assert first.price_frequency is None
    assert first.beds == 4
    assert first.baths == 3
    assert first.receptions == 2



def test_parse_listings_extracts_lettings_status_and_frequency() -> None:
    source = PartnersSource()
    listings = source._parse_listings(SAMPLE_HTML, department="lettings")

    second = listings[1]
    assert second.status == "Let Agreed"
    assert second.price_raw == "£2,000 pcm"
    assert second.price_value == 2000.0
    assert second.price_frequency == "month"
    assert second.region == "Kirk Michael"



def test_extract_next_page_url_reads_rel_next() -> None:
    source = PartnersSource()
    assert source._extract_next_page_url(SAMPLE_HTML) == "https://www.partners.co.im/property-for-sale?page=2"
