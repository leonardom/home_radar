from scraper.sources.manxmove import ManxmoveSource

SAMPLE_HTML = """
<html>
  <body>
    <div class="property list-property-card">
      <div class="list__grid-image-container">
        <a
          href="/properties/sale/isle-of-man/isle-of-man/29-sunningdale-drive-onchan-im3-1el/"
          class="list__grid-image-parent"
        >
          <div class="large__image">
            <img class="property-list-img lazyload" data-src="img.jpg" alt="s" />
          </div>
        </a>
      </div>
      <div class="property__meta">
        <div class="property__address">29, Sunningdale Drive, Onchan, IM3 1EL</div>
        <div class="property__price"><span>Asking Price Of</span> £420,000</div>
        <ul class="property__rooms">
          <li><svg class="icon__bed"></svg>4</li>
          <li><svg class="icon__reception"></svg>3</li>
          <li><svg class="icon__bath"></svg>1</li>
        </ul>
      </div>
    </div>

    <nav>
      <ul class="pagination">
        <li class="page-item active">
          <a class="page-link" href="?paged=1&instruction_type=sale&showstc=on">1</a>
        </li>
        <li class="page-item">
          <a class="page-link" href="?paged=2&instruction_type=sale&showstc=on" aria-label="Next"
            >&rsaquo;</a
          >
        </li>
      </ul>
    </nav>
  </body>
</html>
"""


def test_parse_listings_extracts_expected_fields() -> None:
    source = ManxmoveSource()
    listings = source._parse_listings(SAMPLE_HTML, department="sales")

    assert len(listings) == 1
    listing = listings[0]
    assert listing.source == "manxmove"
    assert listing.department == "sales"
    assert (
        listing.listing_url
        == "https://www.manxmove.im/properties/sale/isle-of-man/isle-of-man/29-sunningdale-drive-onchan-im3-1el/"
    )
    assert listing.title == "29, Sunningdale Drive, Onchan, IM3 1EL"
    assert listing.region == "Onchan"
    assert listing.cover_image_url == "https://www.manxmove.im/img.jpg"
    assert listing.status == "FOR SALE"
    assert listing.price_raw == "Asking Price Of £420,000"
    assert listing.price_value == 420000.0
    assert listing.beds == 4
    assert listing.receptions == 3
    assert listing.baths == 1


def test_extract_next_page_number_returns_integer() -> None:
    source = ManxmoveSource()
    assert source._extract_next_page_number(SAMPLE_HTML) == 2


def test_parse_listings_extracts_monthly_price_frequency_for_lettings() -> None:
    source = ManxmoveSource()
    html = SAMPLE_HTML.replace("£420,000", "£1,800 pcm")

    listings = source._parse_listings(html, department="lettings")

    assert len(listings) == 1
    assert listings[0].price_frequency == "month"
    assert listings[0].status == "TO LET"
