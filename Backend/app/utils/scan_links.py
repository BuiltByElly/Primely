import httpx

from app.core.config import settings


async def scan_links(urls: list[str]) -> set[str]:
    """Returns a set of malicious URLs"""
    api_key = settings.GOOGLE_SAFE_BROWSING_API_KEY

    payload = {
        "client": {"clientId": "primely", "clientVersion": "1.0"},
        "threatInfo": {
            "threatTypes": [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url} for url in urls],
        },
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    # Empty response = all safe
    if not data:
        return set()

    # Extract malicious URLs
    return {match["threat"]["url"] for match in data.get("matches", [])}
