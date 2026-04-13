# Food Search Proxy — Reference Code

This document captures the working code from `~/Workspace/food-search-proxy` that will be ported into the health app's Next.js API routes. Once ported, the standalone Flask service can be retired.

## Source: app.py (Flask application)

**Port to:** `src/lib/usda.ts` + `src/app/api/food/search/route.ts` + `src/app/api/food/barcode/[upc]/route.ts`

### USDA Nutrient ID Map
```python
NUTRIENT_MAP = {
    1008: "calories",
    1003: "protein_g",
    1004: "fat_g",
    1005: "carbs_g",
    2000: "sugar_g",
    1093: "sodium_mg",
    1079: "fiber_g",
}
```

### strip_food() — Core response minimizer
```python
def strip_food(food):
    """Strip a USDA food item down to essential fields."""
    nutrients = {}
    for n in food.get("foodNutrients", []):
        nid = n.get("nutrientId") or (n.get("nutrient", {}).get("id"))
        if nid in NUTRIENT_MAP:
            nutrients[NUTRIENT_MAP[nid]] = round(n.get("value", 0), 1)

    return {
        "fdc_id": food.get("fdcId"),
        "description": food.get("description", ""),
        "brand": food.get("brandOwner") or food.get("brandName", ""),
        "upc": food.get("gtinUpc", ""),
        "serving_size": food.get("servingSize"),
        "serving_unit": food.get("servingSizeUnit", ""),
        "data_type": food.get("dataType", ""),
        **nutrients,
    }
```

### /search endpoint
```python
@app.route("/search")
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Missing query parameter 'q'"}), 400

    page_size = min(int(request.args.get("limit", 5)), 25)
    data_types = request.args.getlist("dataType") or ["Branded", "Survey (FNDDS)"]

    resp = requests.post(
        f"{USDA_BASE_URL}/foods/search",
        params={"api_key": USDA_API_KEY},
        json={
            "query": query,
            "pageSize": page_size,
            "dataType": data_types,
        },
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()

    results = [strip_food(f) for f in data.get("foods", [])]
    return jsonify({
        "query": query,
        "total": data.get("totalHits", 0),
        "results": results,
    })
```

### /barcode/<upc> endpoint
```python
@app.route("/barcode/<upc>")
def barcode(upc):
    resp = requests.post(
        f"{USDA_BASE_URL}/foods/search",
        params={"api_key": USDA_API_KEY},
        json={
            "query": upc,
            "pageSize": 3,
            "dataType": ["Branded"],
        },
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()

    foods = data.get("foods", [])
    matches = [f for f in foods if f.get("gtinUpc") == upc]
    if not matches:
        matches = foods[:1]

    if not matches:
        try:
            scraped = scrape_barcode(upc)
        except Exception:
            scraped = None

        if scraped:
            return jsonify(scraped)

        return jsonify({
            "error": "not_found",
            "upc": upc,
            "message": f"No food found for barcode {upc}",
            "suggestion": "Try searching by product name instead.",
        }), 404

    return jsonify(strip_food(matches[0]))
```

## Source: scraper.py (Barcode fallback)

**Port to:** `src/lib/scraper.ts` (use Playwright for Node.js + cheerio for parsing)

```python
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth


def scrape_barcode(upc: str) -> dict | None:
    url = f"https://www.barcodelookup.com/{upc}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1920, "height": 1080},
        )
        Stealth().apply_stealth_sync(context)
        page = context.new_page()

        try:
            page.goto(url, wait_until="networkidle", timeout=20000)
            page.wait_for_selector("h4, .product-details", timeout=15000)
            html = page.content()
        except Exception:
            browser.close()
            return None

        browser.close()

    return _parse_barcodelookup(html, upc)


def _parse_barcodelookup(html: str, upc: str) -> dict | None:
    soup = BeautifulSoup(html, "html.parser")

    name_el = soup.find("h4")
    if not name_el:
        return None
    product_name = name_el.get_text(strip=True)

    brand = ""
    for div in soup.find_all("div", class_="product-text-label"):
        text = div.get_text(strip=True)
        if text.startswith("Manufacturer:"):
            span = div.find("span", class_="product-text")
            if span:
                brand = span.get_text(strip=True)
            break

    description = ""
    for div in soup.find_all("div", class_="product-text-label"):
        text = div.get_text(strip=True)
        if text.startswith("Description:"):
            span = div.find("span", class_="product-text")
            if span:
                description = span.get_text(strip=True)
            break

    features = []
    features_ul = soup.find("ul", id="product-features")
    if features_ul:
        for li in features_ul.find_all("li", class_="product-text"):
            features.append(li.get_text(strip=True))

    attributes = {}
    attrs_ul = soup.find("ul", id="product-attributes")
    if attrs_ul:
        for li in attrs_ul.find_all("li", class_="product-text"):
            text = li.get_text(strip=True)
            if ":" in text:
                key, _, value = text.partition(":")
                attributes[key.strip()] = value.strip()

    stores = []
    store_section = soup.find("div", class_="online-stores")
    if store_section:
        for li in store_section.find_all("li"):
            name_span = li.find("span", class_="store-name")
            price_span = li.find("span", class_="store-link")
            if name_span and price_span:
                store_name = name_span.get_text(strip=True).rstrip(":")
                price = price_span.get_text(strip=True)
                stores.append({"store": store_name, "price": price})

    image = ""
    og_img = soup.find("meta", attrs={"property": "og:image"})
    if og_img:
        image = og_img.get("content", "")

    return {
        "upc": upc,
        "description": product_name,
        "brand": brand,
        "product_description": description,
        "features": features,
        "stores": stores,
        "attributes": attributes,
        "image": image,
        "data_source": "barcodelookup.com",
    }
```

## Key Implementation Notes

- USDA API key: stored as env var `USDA_API_KEY`
- USDA base URL: `https://api.nal.usda.gov/fdc/v1`
- Default search: 5 results, max 25
- Data types for search: `["Branded", "Survey (FNDDS)"]`
- Data types for barcode: `["Branded"]` only
- Response stripping reduces USDA payloads from 20KB+ to ~150 bytes per result
- Scraper uses Playwright stealth to bypass Cloudflare on barcodelookup.com
- Three-tier barcode: exact UPC match -> best USDA match -> scraper -> 404
