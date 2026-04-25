def extract_browser(browser: str) -> str:
    if "Edg/" in browser:
        return "Edge"
    if "OPR/" in browser or "Opera" in browser:
        return "Opera"
    if "Chrome/" in browser:
        return "Chrome"
    if "Firefox/" in browser:
        return "Firefox"
    if "Safari/" in browser and "Chrome" not in browser:
        return "Safari"
    return "Unknown"
