from scraper.sources.chrystals import ChrystalsSource

SAMPLE_HTML = """
<html>
  <body>
    <ul class="propertyContainer flex">
      <li class="eapow-row0 eapow-overview-row" id="eapow-listing-12178347">
        <div class="row-fluid">
          <div class="span12 eapow-overview-img">
            <div class="eapow-property-thumb-holder">
              <a href="/properties-for-sale/property/12178347-meary-voar-arragon-santon">
                <img
                  class="lozad img"
                  data-src="https://med04.expertagent.co.uk/images/properties/1/main.jpg"
                />
              </a>
            </div>
          </div>
        </div>

        <div class="eapow-overview-title">
          <h3>Meary Voar, Arragon, Santon</h3>
        </div>

        <div class="eapow-overview-price propPrice">Offers in Excess of £5,000,000</div>

        <div class="span12 propIcons">
          <i class="propertyIcons-bedroom"></i><span class="IconNum">7</span>
          <i class="propertyIcons-bathroom"></i><span class="IconNum">7</span>
          <i class="propertyIcons-receptions"></i><span class="IconNum">4</span>
        </div>

        <div class="eapow-mod-readmore">
          <a
            href="/properties-for-sale/property/12178347-meary-voar-arragon-santon"
            class="submitBtn"
          >
            Property Details
          </a>
        </div>
      </li>

      <li class="eapow-row0 eapow-overview-row" id="eapow-listing-11296277">
        <div class="eapow-overview-img">
          <div class="eapow-property-thumb-holder">
            <a href="/properties-to-let/property/11296277-example-rental">
              <img
                class="lozad img"
                data-src="https://med04.expertagent.co.uk/images/properties/2/main.jpg"
              />
            </a>
          </div>
        </div>
        <div class="eapow-bannertopright">
          <img src="/templates/banner_let.svg" alt="Let STC" />
        </div>
        <div class="eapow-overview-title">
          <h3>Example Apartment, Douglas, IM1 1AA</h3>
        </div>
        <div class="eapow-overview-price propPrice">Monthly Rental Of £2,000</div>
        <div class="span12 propIcons">
          <i class="propertyIcons-bedroom"></i><span class="IconNum">2</span>
          <i class="propertyIcons-bathroom"></i><span class="IconNum">1</span>
          <i class="propertyIcons-receptions"></i><span class="IconNum">1</span>
        </div>
      </li>
    </ul>

    <ul class="pagination-list">
      <li><a class="pagenav" rel="next" href="/properties-for-sale?start=18">Next</a></li>
    </ul>
  </body>
</html>
"""


def test_parse_listings_extracts_expected_fields_for_sales() -> None:
    source = ChrystalsSource()
    listings = source._parse_listings(SAMPLE_HTML, department="sales")

    assert len(listings) == 2

    first = listings[0]
    assert first.source == "chrystals"
    assert first.department == "sales"
    assert (
        first.listing_url
        == "https://www.chrystals.co.im/properties-for-sale/property/12178347-meary-voar-arragon-santon"
    )
    assert first.title == "Meary Voar, Arragon, Santon"
    assert first.cover_image_url == "https://med04.expertagent.co.uk/images/properties/1/main.jpg"
    assert first.region == "Santon"
    assert first.status == "FOR SALE"
    assert first.price_raw == "Offers in Excess of £5,000,000"
    assert first.price_value == 5000000.0
    assert first.price_frequency is None
    assert first.beds == 7
    assert first.baths == 7
    assert first.receptions == 4



def test_parse_listings_extracts_status_and_frequency_for_lettings() -> None:
    source = ChrystalsSource()
    listings = source._parse_listings(SAMPLE_HTML, department="lettings")

    assert len(listings) == 2
    second = listings[1]
    assert second.status == "Let STC"
    assert second.price_raw == "Monthly Rental Of £2,000"
    assert second.price_value == 2000.0
    assert second.price_frequency == "month"



def test_extract_next_page_url_returns_absolute_url() -> None:
    source = ChrystalsSource()
    assert (
        source._extract_next_page_url(SAMPLE_HTML)
        == "https://www.chrystals.co.im/properties-for-sale?start=18"
    )
