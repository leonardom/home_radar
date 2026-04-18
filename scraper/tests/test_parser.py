from scraper.parser import extract_title, normalize_text, parse_price


def test_extract_title_returns_title_text() -> None:
    html = "<html><head><title>Example Domain</title></head><body></body></html>"
    assert extract_title(html) == "Example Domain"


def test_extract_title_returns_none_when_no_title() -> None:
    html = "<html><head></head><body>Hello</body></html>"
    assert extract_title(html) is None


def test_normalize_text_collapses_whitespace() -> None:
    assert normalize_text("  A   B\n C ") == "A B C"


def test_parse_price_with_frequency() -> None:
    raw, value, frequency = parse_price("£1,400 pcm")
    assert raw == "£1,400 pcm"
    assert value == 1400.0
    assert frequency == "month"


def test_parse_price_without_number_returns_raw_only() -> None:
    raw, value, frequency = parse_price("Price on application")
    assert raw == "Price on application"
    assert value is None
    assert frequency is None


def test_parse_price_with_monthly_slash_frequency() -> None:
    raw, value, frequency = parse_price("£1,250 / month")
    assert raw == "£1,250 / month"
    assert value == 1250.0
    assert frequency == "month"


def test_parse_price_with_per_month_frequency() -> None:
    raw, value, frequency = parse_price("£1,250 per month")
    assert raw == "£1,250 per month"
    assert value == 1250.0
    assert frequency == "month"


def test_parse_price_with_per_calendar_month_frequency() -> None:
    raw, value, frequency = parse_price("£2,000 Per Calendar Month")
    assert raw == "£2,000 Per Calendar Month"
    assert value == 2000.0
    assert frequency == "month"


def test_parse_price_with_per_annum_frequency() -> None:
    raw, value, frequency = parse_price("£25,000 Per Annum")
    assert raw == "£25,000 Per Annum"
    assert value == 25000.0
    assert frequency == "pa"


def test_parse_price_with_monthly_rental_frequency() -> None:
    raw, value, frequency = parse_price("Monthly Rental Of £2,000")
    assert raw == "Monthly Rental Of £2,000"
    assert value == 2000.0
    assert frequency == "month"
