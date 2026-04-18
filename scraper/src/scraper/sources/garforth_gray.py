from __future__ import annotations

from urllib.parse import parse_qs, urljoin, urlparse

from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.fetcher import fetch_html
from scraper.models import Department, ListingRecord, utc_now_iso
from scraper.parser import normalize_text, parse_price
from scraper.sources.base import ListingSource


class GarforthGraySource(ListingSource):
    key = "garforth_gray"
    supported_departments: tuple[Department, ...] = ("sales", "lettings")

    _AJAX_BASE_URL = "https://www.garforthgray.im/assets/inc/ajax.php"
    _DEPARTMENT_FLAGS = {
        "sales": "ajaxGetSaleResults=1",
        "lettings": "ajaxGetRentalsResults=1",
    }

    def scrape(
        self,
        departments: list[Department],
        timeout: float,
        max_pages: int | None,
        user_agent: str,
    ) -> list[ListingRecord]:
        listings: list[ListingRecord] = []

        for department in departments:
            page_number = 1
            pages_seen = 0
            seen_urls_for_department: set[str] = set()

            while max_pages is None or pages_seen < max_pages:
                page_url = self._build_page_url(department, page_number)
                html = fetch_html(page_url, timeout=timeout, user_agent=user_agent)
                parsed = self._parse_listings(html=html, department=department)
                if not parsed:
                    break

                new_items = [
                    item
                    for item in parsed
                    if item.listing_url not in seen_urls_for_department
                ]
                if not new_items:
                    break

                listings.extend(new_items)
                seen_urls_for_department.update(item.listing_url for item in new_items)

                next_page = self._extract_next_page_number(html)
                if next_page is None:
                    break

                page_number = next_page
                pages_seen += 1

        return listings

    def _build_page_url(self, department: Department, page_number: int) -> str:
        return (
            f"{self._AJAX_BASE_URL}?{self._DEPARTMENT_FLAGS[department]}"
            f"&page={page_number}"
        )

    def _parse_listings(self, html: str, department: Department) -> list[ListingRecord]:
        soup = BeautifulSoup(html, "html.parser")
        records: list[ListingRecord] = []

        for card in soup.select("div.properties-list-item"):
            details_link = card.select_one("a.text-card-link[href]")
            if not isinstance(details_link, Tag):
                continue

            listing_url = normalize_text(details_link.get("href", ""))
            if not listing_url:
                continue

            listing_url = urljoin("https://www.garforthgray.im", listing_url)
            title = self._extract_title(details_link)
            region = self._extract_region(details_link)
            cover_image_url = self._extract_cover_image_url(card)
            status = self._extract_status(card, department)
            price_raw, price_value, price_frequency = self._extract_price(card)
            beds, receptions, baths = self._extract_room_counts(details_link)

            records.append(
                ListingRecord(
                    source=self.key,
                    department=department,
                    listing_url=listing_url,
                    title=title,
                    cover_image_url=cover_image_url,
                    region=region,
                    status=status,
                    price_raw=price_raw,
                    price_value=price_value,
                    price_frequency=price_frequency,
                    beds=beds,
                    receptions=receptions,
                    baths=baths,
                    property_type=None,
                    scraped_at=utc_now_iso(),
                )
            )

        return records

    def _extract_next_page_number(self, html: str) -> int | None:
        soup = BeautifulSoup(html, "html.parser")
        next_link = soup.select_one("a.page-link img[alt='Next page']")
        if not isinstance(next_link, Tag):
            return None

        anchor = next_link.find_parent("a")
        if not isinstance(anchor, Tag):
            return None

        href = normalize_text(anchor.get("href", ""))
        if not href:
            return None

        parsed = urlparse(urljoin("https://www.garforthgray.im", href))
        page_values = parse_qs(parsed.query).get("page")
        if not page_values:
            return None

        try:
            return int(page_values[0])
        except ValueError:
            return None

    def _extract_title(self, details_link: Tag) -> str | None:
        title_node = details_link.select_one("p")
        if not isinstance(title_node, Tag):
            return None

        title = normalize_text(title_node.get_text(" ", strip=True))
        return title or None

    def _extract_region(self, details_link: Tag) -> str | None:
        region_node = details_link.select_one(".location")
        if not isinstance(region_node, Tag):
            return None

        region = normalize_text(region_node.get_text(" ", strip=True))
        return region or None

    def _extract_cover_image_url(self, card: Tag) -> str | None:
        image_node = card.select_one(".gallery-property .pic-prop")
        if not isinstance(image_node, Tag):
            return None

        image_path = normalize_text(image_node.get("data-bg", ""))
        if not image_path:
            return None

        return urljoin("https://www.garforthgray.im", image_path)

    def _extract_status(self, card: Tag, department: Department) -> str | None:
        label_node = card.select_one(".label-pic")
        if isinstance(label_node, Tag):
            label = normalize_text(label_node.get_text(" ", strip=True))
            if label:
                return label

        return "FOR SALE" if department == "sales" else "TO LET"

    def _extract_price(self, card: Tag) -> tuple[str | None, float | None, str | None]:
        price_node = card.select_one(".price")
        if not isinstance(price_node, Tag):
            return (None, None, None)

        return parse_price(price_node.get_text(" ", strip=True))

    def _extract_room_counts(self, details_link: Tag) -> tuple[int | None, int | None, int | None]:
        beds: int | None = None
        receptions: int | None = None
        baths: int | None = None

        for highlight in details_link.select(".highlights"):
            number_node = highlight.select_one(".number")
            icon_node = highlight.select_one("img[src]")
            if not isinstance(number_node, Tag) or not isinstance(icon_node, Tag):
                continue

            value_text = normalize_text(number_node.get_text(" ", strip=True))
            try:
                value = int(value_text)
            except ValueError:
                continue

            icon_src = normalize_text(icon_node.get("src", "")).lower()
            if "icon-bed" in icon_src:
                beds = value
            elif "icon-bath" in icon_src:
                baths = value
            elif "icon-sofa" in icon_src:
                receptions = value

        return (beds, receptions, baths)
