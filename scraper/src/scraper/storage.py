from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import Float, Integer, String, UniqueConstraint, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from scraper.models import ListingRecord, ScrapeResult


@dataclass(slots=True)
class PersistStats:
    inserted: int = 0
    updated: int = 0
    unchanged: int = 0


class Base(DeclarativeBase):
    pass


class ListingEntity(Base):
    __tablename__ = "listings"
    __table_args__ = (UniqueConstraint("source", "listing_url", name="uq_listings_source_url"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String, nullable=False)
    department: Mapped[str] = mapped_column(String, nullable=False)
    listing_url: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    region: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True)
    price_raw: Mapped[str | None] = mapped_column(String, nullable=True)
    price_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_frequency: Mapped[str | None] = mapped_column(String, nullable=True)
    beds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    receptions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    baths: Mapped[int | None] = mapped_column(Integer, nullable=True)
    property_type: Mapped[str | None] = mapped_column(String, nullable=True)
    scraped_at: Mapped[datetime] = mapped_column(nullable=False)
    content_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(nullable=False)


def default_sqlite_db_url(db_path: str = "scraper.db") -> str:
    return f"sqlite+pysqlite:///{Path(db_path)}"


def resolve_database_url(*, database_url: str | None = None, db_path: str | None = None) -> str:
    if database_url:
        return database_url

    if db_path:
        return default_sqlite_db_url(db_path)

    return default_sqlite_db_url()


def persist_scrape_result(
    result: ScrapeResult,
    *,
    database_url: str | None = None,
    db_path: str | None = None,
) -> PersistStats:
    resolved_url = resolve_database_url(database_url=database_url, db_path=db_path)
    engine = create_engine(resolved_url, future=True)
    Base.metadata.create_all(engine)

    stats = PersistStats()
    with Session(engine) as session:
        now = _utc_now()
        for listing in result.listings:
            _upsert_listing(session, listing, now, stats)

        session.commit()

    return stats


def _upsert_listing(
    session: Session,
    listing: ListingRecord,
    now: datetime,
    stats: PersistStats,
) -> None:
    content_hash = compute_listing_hash(listing)

    existing = session.execute(
        select(ListingEntity).where(
            ListingEntity.source == listing.source,
            ListingEntity.listing_url == listing.listing_url,
        )
    ).scalar_one_or_none()

    if existing is None:
        session.add(
            ListingEntity(
                source=listing.source,
                department=listing.department,
                listing_url=listing.listing_url,
                title=listing.title,
                cover_image_url=listing.cover_image_url,
                region=listing.region,
                status=listing.status,
                price_raw=listing.price_raw,
                price_value=listing.price_value,
                price_frequency=listing.price_frequency,
                beds=listing.beds,
                receptions=listing.receptions,
                baths=listing.baths,
                property_type=listing.property_type,
                scraped_at=_parse_iso_datetime(listing.scraped_at),
                content_hash=content_hash,
                created_at=now,
                updated_at=now,
                last_seen_at=now,
            )
        )
        stats.inserted += 1
        return

    if existing.content_hash == content_hash:
        existing.scraped_at = _parse_iso_datetime(listing.scraped_at)
        existing.last_seen_at = now
        stats.unchanged += 1
        return

    existing.department = listing.department
    existing.title = listing.title
    existing.cover_image_url = listing.cover_image_url
    existing.region = listing.region
    existing.status = listing.status
    existing.price_raw = listing.price_raw
    existing.price_value = listing.price_value
    existing.price_frequency = listing.price_frequency
    existing.beds = listing.beds
    existing.receptions = listing.receptions
    existing.baths = listing.baths
    existing.property_type = listing.property_type
    existing.scraped_at = _parse_iso_datetime(listing.scraped_at)
    existing.content_hash = content_hash
    existing.updated_at = now
    existing.last_seen_at = now
    stats.updated += 1


def compute_listing_hash(listing: ListingRecord) -> str:
    # Use stable business fields only, excluding volatile scrape timestamps.
    payload = {
        "source": listing.source,
        "department": listing.department,
        "listing_url": listing.listing_url,
        "title": listing.title,
        "cover_image_url": listing.cover_image_url,
        "region": listing.region,
        "status": listing.status,
        "price_raw": listing.price_raw,
        "price_value": listing.price_value,
        "price_frequency": listing.price_frequency,
        "beds": listing.beds,
        "receptions": listing.receptions,
        "baths": listing.baths,
        "property_type": listing.property_type,
    }
    encoded = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_iso_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
