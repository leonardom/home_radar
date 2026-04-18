from __future__ import annotations

import re
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.models import Department, ListingRecord, utc_now_iso
from scraper.parser import normalize_text, parse_price
from scraper.sources.base import ListingSource


class CowleyGrovesSource(ListingSource):
    key = "cowley_groves"
    supported_departments: tuple[Department, ...] = ("sales", "lettings")

    _BASE_URL = "https://www.cowleygroves.com/"
    _DEPARTMENT_CONFIG = {
        "sales": {
            "search_url": "https://www.cowleygroves.com/sales",
            "sel_rent": "Sale",
            "type": "sale",
        },
        "lettings": {
            "search_url": "https://www.cowleygroves.com/rentals",
            "sel_rent": "Rental",
            "type": "rental",
        },
    }

    def scrape(
        self,
        departments: list[Department],
        timeout: float,
        max_pages: int | None,
        user_agent: str,
    ) -> list[ListingRecord]:
        listings: list[ListingRecord] = []
        headers = {"User-Agent": user_agent}

        with httpx.Client(timeout=timeout, follow_redirects=True, headers=headers) as client:
            for department in departments:
                initial_html = self._fetch_initial_page(client, department)
                action_url, base_payload = self._build_request_context(initial_html, department)

                page_number = 1
                pages_seen = 0
                seen_urls_for_department: set[str] = set()

                while max_pages is None or pages_seen < max_pages:
                    payload = dict(base_payload)
                    payload["page"] = str(page_number)
                    html = self._fetch_results_page(client, action_url=action_url, payload=payload)
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

                    page_number += 1
                    pages_seen += 1

        return listings

    def _fetch_initial_page(self, client: httpx.Client, department: Department) -> str:
        search_url = self._DEPARTMENT_CONFIG[department]["search_url"]
        response = client.get(search_url)
        response.raise_for_status()
        return response.text

    def _build_request_context(
        self,
        html: str,
        department: Department,
    ) -> tuple[str, dict[str, str]]:
        soup = BeautifulSoup(html, "html.parser")
        form = soup.select_one("form#FilterForm")
        if not isinstance(form, Tag):
            raise RuntimeError("could not find Cowley Groves filter form")

        action = normalize_text(form.get("action", ""))
        if not action:
            raise RuntimeError("could not determine Cowley Groves AJAX endpoint")

        token_node = form.select_one("input[name='_token']")
        token = (
            normalize_text(token_node.get("value", ""))
            if isinstance(token_node, Tag)
            else ""
        )
        if not token:
            raise RuntimeError("could not extract Cowley Groves CSRF token")

        config = self._DEPARTMENT_CONFIG[department]
        payload = {
            "ajax": "true",
            "page": "1",
            "_token": token,
            "res_com": "Residential",
            "sel_rent": config["sel_rent"],
            "type": config["type"],
        }

        sort_value = ""
        selected_sort = form.select_one("select[name='sort_order'] option[selected]")
        if isinstance(selected_sort, Tag):
            sort_value = normalize_text(selected_sort.get("value", ""))
        if sort_value:
            payload["sort_order"] = sort_value

        action_url = urljoin(self._BASE_URL, action)
        return (action_url, payload)

    def _fetch_results_page(
        self,
        client: httpx.Client,
        action_url: str,
        payload: dict[str, str],
    ) -> str:
        response = client.post(action_url, data=payload)
        response.raise_for_status()
        return response.text

    def _parse_listings(self, html: str, department: Department) -> list[ListingRecord]:
        soup = BeautifulSoup(html, "html.parser")
        records: list[ListingRecord] = []

        for details_link in soup.select("li > a[href*='/property/']"):
            if not isinstance(details_link, Tag):
                continue

            listing_url = normalize_text(details_link.get("href", ""))
            if not listing_url:
                continue
            listing_url = urljoin(self._BASE_URL, listing_url)

            title = self._extract_title(details_link)
            cover_image_url = self._extract_cover_image_url(details_link)
            region = self._extract_region(title)
            status = self._extract_status(details_link, department)
            price_raw, price_value, price_frequency = self._extract_price(details_link)
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

    def _extract_title(self, details_link: Tag) -> str | None:
        title_node = details_link.select_one("h4")
        if not isinstance(title_node, Tag):
            return None

        title = normalize_text(title_node.get_text(" ", strip=True))
        return title or None

    def _extract_cover_image_url(self, details_link: Tag) -> str | None:
        for image in details_link.select(".img-holder img"):
            if not isinstance(image, Tag):
                continue

            class_names = set(image.get("class", []))
            if "holder" in class_names:
                continue

            src = normalize_text(image.get("src", ""))
            if src:
                return urljoin(self._BASE_URL, src)

        return None

    def _extract_region(self, title: str | None) -> str | None:
        if title is None:
            return None

        parts = [normalize_text(part) for part in title.split(",") if normalize_text(part)]
        if len(parts) < 2:
            return None

        for part in reversed(parts):
            upper = part.upper()
            if upper in {"ISLE OF MAN", "IOM"}:
                continue
            if re.match(r"^IM\d", upper):
                continue
            return part

        return None

    def _extract_status(self, details_link: Tag, department: Department) -> str | None:
        status_node = details_link.select_one("span.status")
        if isinstance(status_node, Tag):
            status = normalize_text(status_node.get_text(" ", strip=True))
            if status:
                return status

        return "FOR SALE" if department == "sales" else "TO LET"

    def _extract_price(self, details_link: Tag) -> tuple[str | None, float | None, str | None]:
        price_node = details_link.select_one("span.price")
        if not isinstance(price_node, Tag):
            return (None, None, None)

        old_price_node = price_node.select_one("span.old_price")
        if isinstance(old_price_node, Tag):
            old_price_node.extract()

        return parse_price(price_node.get_text(" ", strip=True))

    def _extract_room_counts(self, details_link: Tag) -> tuple[int | None, int | None, int | None]:
        beds: int | None = None
        receptions: int | None = None
        baths: int | None = None

        for attr in details_link.select("span.attr"):
            if not isinstance(attr, Tag):
                continue

            class_names = set(attr.get("class", []))
            text_value = normalize_text(attr.get_text(" ", strip=True))
            match = re.search(r"\d+", text_value)
            if match is None:
                continue

            value = int(match.group(0))
            if "bedrooms" in class_names:
                beds = value
            elif "receptions" in class_names:
                receptions = value
            elif "bathrooms" in class_names:
                baths = value
            elif "en_suites" in class_names and baths is None:
                baths = value

        return (beds, receptions, baths)
