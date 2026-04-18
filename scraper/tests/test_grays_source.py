from scraper.sources.grays import GraysSource

SAMPLE_HTML = """
<html>
  <body>
    <div class="v2-flex v2-flex-col v2-relative v2-gap-y-3">
      <div class="v2-w-full v2-relative v2-bg-light-grey">
        <a href="/listings/residential_sale-RX111-isle-of-man">
          <img
            data-testid="shared-image-component"
            src="//uk-crm.cdns.rexsoftware.com/app/livestore/accounts/4994/listings/111/images/a.jpg"
          />
        </a>
      </div>
      <div class="v2-flex v2-flex-col v2-items-start v2-gap-y-1.5">
        <strong class="v2-text-body-bold v2-text-primary-500">£450,000</strong>
        <a href="/listings/residential_sale-RX111-isle-of-man">
          <h4>Bride, Isle Of Man, IM7 4</h4>
        </a>
        <div class="v2-flex v2-flex-wrap v2-gap-2.5">
          <p class="v2-text-body-small">7 Bed</p>
          <p class="v2-text-body-small">5 Bath</p>
          <p class="v2-text-body-small">2 Lounge</p>
        </div>
      </div>
    </div>

    <div class="v2-flex v2-flex-col v2-relative v2-gap-y-3">
      <a href="/listings/residential_rental-RX222-isle-of-man">
        <img
          data-testid="shared-image-component"
          src="//uk-crm.cdns.rexsoftware.com/app/livestore/accounts/4994/listings/222/images/b.jpg"
        />
      </a>
      <div class="v2-property-banner"><span>Let Agreed</span></div>
      <strong class="v2-text-body-bold v2-text-primary-500">
        <span>£1,300 pcm</span><span>£300 pw</span>
      </strong>
      <a href="/listings/residential_rental-RX222-isle-of-man">
        <h4>Douglas, Isle Of Man, IM1</h4>
      </a>
      <p class="v2-text-body-small">3 Bed</p>
      <p class="v2-text-body-small">1 Bath</p>
    </div>

    <a href="/listings?saleOrRental=Sale&amp;page=2" rel="next">Next</a>
  </body>
</html>
"""


def test_parse_listings_extracts_sales_fields() -> None:
    source = GraysSource()
    listings = source._parse_listings(SAMPLE_HTML, department="sales")

    assert len(listings) == 2

    first = listings[0]
    assert first.source == "grays"
    assert first.department == "sales"
    assert (
        first.listing_url
        == "https://graysestateagents.com/listings/residential_sale-RX111-isle-of-man"
    )
    assert first.title == "Bride, Isle Of Man, IM7 4"
    assert first.cover_image_url.startswith("https://uk-crm.cdns.rexsoftware.com/")
    assert first.region == "Bride"
    assert first.status == "FOR SALE"
    assert first.price_raw == "£450,000"
    assert first.price_value == 450000.0
    assert first.price_frequency is None
    assert first.beds == 7
    assert first.receptions == 2
    assert first.baths == 5


def test_parse_listings_extracts_lettings_fields() -> None:
    source = GraysSource()
    listings = source._parse_listings(SAMPLE_HTML, department="lettings")

    second = listings[1]
    assert second.status == "Let Agreed"
    assert second.price_raw == "£1,300 pcm £300 pw"
    assert second.price_value == 1300.0
    assert second.price_frequency == "month"
    assert second.region == "Douglas"


def test_extract_next_page_url_reads_rel_next() -> None:
    source = GraysSource()
    assert (
        source._extract_next_page_url(SAMPLE_HTML)
        == "https://graysestateagents.com/listings?saleOrRental=Sale&page=2"
    )


def test_extract_region_skips_street_when_locality_missing() -> None:
  source = GraysSource()

  assert source._extract_region("Stanley Road, Isle Of Man, IM5 1") is None
  assert source._extract_region("Ballakermeen Road, Douglas, IM1") == "Douglas"
