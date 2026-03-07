#!/usr/bin/env python3
"""
EvetechWorker
Virtual API scraper for Evetech, conforming to the existing BaseSupplierWorker interface.

Discovery:
- Fetch sitemap from https://www.evetech.co.za/api/sitemap
- Extract all product URLs from <loc> entries

Extraction:
- Scrape per-product page using httpx and BeautifulSoup
- Extract: name, SKU, price, stock status
- Map to internal schema:
  - internal_sku = Scraped SKU
  - internal_price = Scraped price as decimal
  - is_available = True if "In Stock" present, else False

Adapter:
- Return a dict per product with fields:
  {
    "name": "...",
    "internal_sku": "...",
    "internal_price": "<decimal as string>",
    "is_available": bool,
    "raw_stock_text": "...",
    "url": "..."
  }

Worker Constraints:
- 1 second delay between page loads (crawl-delay)
- User-Agent: WhosGotStockBot/1.0
- Errors logged via standard logging

Notes:
- This is designed to be dropped into /worker directory alongside existing workers.
- If your project uses a different BaseSupplierWorker import path, you can swap the import line to match your codebase.
"""
from __future__ import annotations

import time
import logging
import re
from decimal import Decimal
from typing import List, Dict, Any, Optional

import httpx
try:
    from bs4 import BeautifulSoup
except Exception:
    BeautifulSoup = None  # Fallback if bs4 isn't installed

# Attempt to import the project's base interface. Fallback to a minimal stub if unavailable.
try:
    # Typical project layout: from base_supplier_worker import BaseSupplierWorker
    from base_supplier_worker import BaseSupplierWorker  # type: ignore
except Exception:
    class BaseSupplierWorker:  # Minimal fallback for environments without the base class
        name: str = "base"
        def __init__(self, *args, **kwargs):
            pass


class EvetechWorker(BaseSupplierWorker):
    """
    Evetech supplier worker.
    Produces data in the same shape as other workers in this project.
    """
    name = "evetech"
    sitemap_url = "https://www.evetech.co.za/api/sitemap"
    user_agent = "WhosGotStockBot/1.0"
    crawl_delay = 1.0  # seconds
    timeout = 20  # HTTP timeout seconds

    def __init__(self, logger: Optional[logging.Logger] = None, delay: float = 1.0, timeout: int = 20):
        self.logger = logger or logging.getLogger(self.__class__.__name__)
        self.delay = delay
        self.timeout = timeout
        self.headers = {"User-Agent": self.user_agent}

    def _discover_urls(self) -> List[str]:
        """Discovery: fetch sitemap and collect product URLs"""
        try:
            resp = httpx.get(self.sitemap_url, headers=self.headers, timeout=self.timeout)
            resp.raise_for_status()
        except Exception as e:
            self.logger.exception("Evetech sitemap fetch failed: %s", e)
            return []

        urls: List[str] = []
        try:
            if BeautifulSoup:
                soup = BeautifulSoup(resp.text, "html.parser")
                for loc in soup.find_all("loc"):
                    u = loc.get_text(strip=True)
                    if u and u.startswith("http"):
                        urls.append(u)
            else:
                import re as _re
                for m in _re.finditer(r"<loc>(https?://[^<]+)</loc>", resp.text, flags=_re.IGNORECASE):
                    urls.append(m.group(1))
        except Exception as e:
            self.logger.exception("Evetech sitemap parsing failed: %s", e)
        return urls

    def _scrape_product(self, url: str) -> Optional[Dict[str, Any]]:
        """Extraction: scrape name, SKU, price, stock from a product page"""
        try:
            resp = httpx.get(url, headers=self.headers, timeout=self.timeout)
            resp.raise_for_status()
        except Exception as e:
            self.logger.exception("Failed to fetch Evetech product page %s: %s", url, e)
            return None

        if BeautifulSoup:
            soup = BeautifulSoup(resp.text, "html.parser")
            # Name
            name = ""
            if soup.find("h1"):
                name = soup.find("h1").get_text(strip=True)
            elif soup.find("h2"):
                name = soup.find("h2").get_text(strip=True)
            # SKU
            sku = None
            for tag in soup.find_all(True):
                text = tag.get_text(" ", strip=True)
                if text and "sku" in text.lower():
                    for token in text.split():
                        if re.match(r"^[A-Z0-9\-]{3,}$", token):
                            sku = token
                            break
                if sku:
                    break
            if not sku:
                for tag in soup.find_all(attrs={"data-sku": True}):
                    if tag.get("data-sku"):
                        sku = tag.get("data-sku")
                        break
            # Price
            price_text = None
            price_candidates = soup.find_all(class_=lambda c: c and "price" in c.lower()) or []
            for t in price_candidates:
                text = t.get_text(strip=True)
                m = re.search(r"([0-9]+(?:\.[0-9]{2})?)", text.replace(",", ""))
                if m:
                    price_text = m.group(1)
                    break
            if price_text is None:
                for tag in soup.find_all(id=lambda i: i and "price" in i.lower()):
                    m = re.search(r"([0-9]+(?:\.[0-9]{2})?)", tag.get_text(strip=True).replace(",", ""))
                    if m:
                        price_text = m.group(1)
                        break
            # Stock status
            stock_text = ""
            for t in soup.find_all(string=True):
                if "stock" in t.lower():
                    stock_text = t.strip()
                    break
        else:
            # Fallback parsing without bs4
            name = ""
            m = re.search(r"<h1[^>]*>(.*?)</h1>", resp.text, re.IGNORECASE | re.DOTALL)
            if m:
                name = m.group(1).strip()
            sku = ""
            m = re.search(r"SKU|sku|sku:\s*([A-Z0-9\-]+)", resp.text, re.IGNORECASE)
            if m:
                sku = m.group(1)
            price_text = None
            m = re.search(r"([0-9]+(?:\.[0-9]{2})?)", resp.text.replace(",", ""))
            if m:
                price_text = m.group(1)
            stock_text = ""
            m = re.search(r"In Stock|In stock|in stock|stock", resp.text, re.IGNORECASE)
            if m:
                stock_text = m.group(0)

        internal_sku = sku or ""
        internal_price = Decimal(price_text) if price_text else Decimal("0.00")
        is_available = bool(stock_text and "in stock" in stock_text.lower())

        return {
            "name": name,
            "internal_sku": internal_sku,
            "internal_price": str(internal_price),
            "is_available": is_available,
            "raw_stock_text": stock_text,
            "url": url
        }

    # Public API expected by the admin portal
    def discovery(self) -> List[str]:
        return self._discover_urls()

    def run(self) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        urls = self._discover_urls()
        for url in urls:
            data = self._scrape_product(url)
            if data:
                results.append(data)
            time.sleep(self.delay)  # crawl-delay
        return results


if __name__ == "__main__":
    # Simple CLI entry to run as a frictionless test endpoint
    import json
    w = EvetechWorker()
    try:
        data = w.run()
        print(json.dumps(data, default=str))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
