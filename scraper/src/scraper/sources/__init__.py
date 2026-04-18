from __future__ import annotations

from scraper.sources.base import ListingSource
from scraper.sources.black_grace_cowley import BlackGraceCowleySource
from scraper.sources.chrystals import ChrystalsSource
from scraper.sources.cowley_groves import CowleyGrovesSource
from scraper.sources.dandara import DandaraSource
from scraper.sources.deanwood import DeanwoodSource
from scraper.sources.garforth_gray import GarforthGraySource
from scraper.sources.grays import GraysSource
from scraper.sources.hartford import HartfordSource
from scraper.sources.manxmove import ManxmoveSource
from scraper.sources.partners import PartnersSource
from scraper.sources.prosearch import ProsearchSource


def get_sources() -> dict[str, ListingSource]:
    return {
        BlackGraceCowleySource.key: BlackGraceCowleySource(),
        ChrystalsSource.key: ChrystalsSource(),
        CowleyGrovesSource.key: CowleyGrovesSource(),
        DandaraSource.key: DandaraSource(),
        DeanwoodSource.key: DeanwoodSource(),
        GarforthGraySource.key: GarforthGraySource(),
        GraysSource.key: GraysSource(),
        HartfordSource.key: HartfordSource(),
        ManxmoveSource.key: ManxmoveSource(),
        PartnersSource.key: PartnersSource(),
        ProsearchSource.key: ProsearchSource(),
    }


def get_source(source_key: str) -> ListingSource:
    sources = get_sources()
    source = sources.get(source_key)
    if source is None:
        available = ", ".join(sorted(sources))
        raise ValueError(f"unknown source '{source_key}'. available sources: {available}")
    return source
