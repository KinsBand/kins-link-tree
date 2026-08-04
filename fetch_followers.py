#!/usr/bin/env python3
"""
Kins Band - Social Follower Count Fetcher
Runs daily via GitHub Actions and writes followers.json to the repo.

Platforms covered:
  - YouTube     : YouTube Data API v3   (requires: YOUTUBE_API_KEY secret)
  - Twitch      : Twitch Helix API      (requires: TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET secrets)
  - Instagram   : Instagram Basic Display API or Meta Graph (requires: INSTAGRAM_ACCESS_TOKEN)
  - TikTok      : TikTok Research API   (requires: TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET)
  - Twitter/X   : Twitter API v2        (requires: TWITTER_BEARER_TOKEN)
  - SoundCloud  : SoundCloud API        (requires: SOUNDCLOUD_CLIENT_ID)
  - Spotify     : Spotify Web API       (requires: SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET)
  - LinkedIn    : LinkedIn API          (requires: LINKEDIN_ACCESS_TOKEN)

If a secret is missing the script keeps the previous value from followers.json.
"""

import json
import os
import sys
import re
import ssl
import datetime
import urllib.request
import urllib.parse
import urllib.error

# Ensure SSL context works across all platforms/Windows local environments
try:
    _create_unverified_https_context = ssl._create_unverified_context
    ssl._create_default_https_context = _create_unverified_https_context
except AttributeError:
    pass

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# ──────────────────────────────────────────────────────────────
# Config — edit these to match your actual account IDs/handles
# ──────────────────────────────────────────────────────────────
CONFIG = {
    "youtube_channel_id":   "UC94kChx7J3yo4dCRdX6M3Fg",   # Real YouTube Channel ID
    "twitch_login":         "kinsbandoffical",            # Real Twitch Username
    "instagram_user_id":    "17841XXXXXXXXXX",            # numeric user ID for Meta Graph
    "tiktok_username":      "KinsBandOfficial",
    "twitter_username":     "KinsBandOfficia",            # Real Twitter / X Handle (15 chars)
    "soundcloud_permalink": "KinsBandOfficial",
    "spotify_artist_id":    "31gmlrlrd3c2cjcwbyg73ywurdre",# Real Spotify Profile ID
    "linkedin_org_id":      "00000000",                   # org ID from LinkedIn URL
}

FOLLOWERS_FILE = os.path.join(os.path.dirname(__file__), "followers.json")


def load_current() -> dict:
    try:
        with open(FOLLOWERS_FILE, "r") as f:
            data = json.load(f)
        return data.get("platforms", {})
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def http_get(url: str, headers: dict = None) -> dict | None:
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  ⚠ HTTP error for {url[:60]}…: {e}", file=sys.stderr)
        return None


def http_post_form(url: str, data: dict) -> dict | None:
    encoded = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=encoded, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  ⚠ POST error for {url}: {e}", file=sys.stderr)
        return None


# ──────────────────────────────────────────────────────────────
# Platform Fetchers
# ──────────────────────────────────────────────────────────────

def fetch_youtube() -> int | None:
    key = os.environ.get("YOUTUBE_API_KEY")
    if not key:
        print("  ⏭ YOUTUBE_API_KEY not set, skipping.")
        return None
    channel_id = CONFIG["youtube_channel_id"]
    url = (
        f"https://www.googleapis.com/youtube/v3/channels"
        f"?part=statistics&id={channel_id}&key={key}"
    )
    data = http_get(url)
    if data and data.get("items"):
        count = int(data["items"][0]["statistics"]["subscriberCount"])
        print(f"  ✓ YouTube subscribers: {count:,}")
        return count
    return None


def fetch_twitch() -> int | None:
    client_id = os.environ.get("TWITCH_CLIENT_ID")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET")
    if not client_id or not client_secret:
        print("  ⏭ TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET not set, skipping.")
        return None

    # Step 1: Get App Access Token
    token_data = http_post_form("https://id.twitch.tv/oauth2/token", {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
    })
    if not token_data or "access_token" not in token_data:
        return None
    token = token_data["access_token"]

    # Step 2: Get user ID from login name
    login = CONFIG["twitch_login"]
    user_data = http_get(
        f"https://api.twitch.tv/helix/users?login={login}",
        headers={"Client-Id": client_id, "Authorization": f"Bearer {token}"},
    )
    if not user_data or not user_data.get("data"):
        return None
    user_id = user_data["data"][0]["id"]

    # Step 3: Get follower count
    follower_data = http_get(
        f"https://api.twitch.tv/helix/channels/followers?broadcaster_id={user_id}",
        headers={"Client-Id": client_id, "Authorization": f"Bearer {token}"},
    )
    if follower_data and "total" in follower_data:
        count = follower_data["total"]
        print(f"  ✓ Twitch followers: {count:,}")
        return count
    return None


def fetch_instagram() -> int | None:
    token = os.environ.get("INSTAGRAM_ACCESS_TOKEN")
    user_id = CONFIG["instagram_user_id"]
    if not token or not user_id or user_id.startswith("17841XXXXX"):
        print("  ⏭ INSTAGRAM_ACCESS_TOKEN / user_id not set, skipping.")
        return None
    url = (
        f"https://graph.instagram.com/v19.0/{user_id}"
        f"?fields=followers_count&access_token={token}"
    )
    data = http_get(url)
    if data and "followers_count" in data:
        count = data["followers_count"]
        print(f"  ✓ Instagram followers: {count:,}")
        return count
    return None


def fetch_twitter() -> int | None:
    username = CONFIG["twitter_username"]
    bearer = os.environ.get("TWITTER_BEARER_TOKEN")

    # Try official API v2 first if token present
    if bearer:
        url = f"https://api.twitter.com/2/users/by/username/{username}?user.fields=public_metrics"
        data = http_get(url, headers={"Authorization": f"Bearer {bearer}"})
        if data and data.get("data"):
            count = data["data"]["public_metrics"]["followers_count"]
            print(f"  ✓ Twitter/X followers (API): {count:,}")
            return count

    # Fallback to Twitter Web Syndication
    try:
        url = f"https://syndication.twitter.com/srv/timeline-profile/pk/{username}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode()
        match = re.search(r'"followers_count":\s*(\d+)', html)
        if match:
            count = int(match.group(1))
            print(f"  ✓ Twitter/X followers (web): {count:,}")
            return count
    except Exception as e:
        print(f"  ⚠ Twitter/X error: {e}", file=sys.stderr)
    return None


def fetch_tiktok() -> int | None:
    client_key = os.environ.get("TIKTOK_CLIENT_KEY")
    client_secret = os.environ.get("TIKTOK_CLIENT_SECRET")
    username = CONFIG["tiktok_username"]

    # Try official API if keys present
    if client_key and client_secret:
        token_data = http_post_form("https://open.tiktokapis.com/v2/oauth/token/", {
            "client_key": client_key,
            "client_secret": client_secret,
            "grant_type": "client_credentials",
        })
        if token_data and "access_token" in token_data:
            token = token_data["access_token"]
            url = f"https://open.tiktokapis.com/v2/research/user/info/?fields=follower_count"
            req_body = json.dumps({"username": username}).encode()
            req = urllib.request.Request(
                url,
                data=req_body,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode())
                count = data["data"]["user_info"]["follower_count"]
                print(f"  ✓ TikTok followers (API): {count:,}")
                return count
            except Exception:
                pass

    # Fallback to public web page scraper
    try:
        url = f"https://www.tiktok.com/@{username}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode()
        match = re.search(r'"followerCount":(\d+)', html)
        if match:
            count = int(match.group(1))
            print(f"  ✓ TikTok followers (web): {count:,}")
            return count
    except Exception as e:
        print(f"  ⚠ TikTok error: {e}", file=sys.stderr)
    return None


def fetch_soundcloud() -> int | None:
    client_id = os.environ.get("SOUNDCLOUD_CLIENT_ID")
    if not client_id:
        print("  ⏭ SOUNDCLOUD_CLIENT_ID not set, skipping.")
        return None
    permalink = CONFIG["soundcloud_permalink"]
    url = f"https://api.soundcloud.com/users/{permalink}?client_id={client_id}"
    data = http_get(url)
    if data and "followers_count" in data:
        count = data["followers_count"]
        print(f"  ✓ SoundCloud followers: {count:,}")
        return count
    return None


def fetch_spotify() -> int | None:
    client_id = os.environ.get("SPOTIFY_CLIENT_ID")
    client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        print("  ⏭ SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set, skipping.")
        return None

    # Client Credentials Flow
    import base64
    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    token_data = None
    req = urllib.request.Request(
        "https://accounts.spotify.com/api/token",
        data=b"grant_type=client_credentials",
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            token_data = json.loads(resp.read().decode())
    except Exception as e:
        print(f"  ⚠ Spotify token error: {e}", file=sys.stderr)
        return None

    token = token_data.get("access_token")
    if not token:
        return None

    artist_id = CONFIG["spotify_artist_id"]
    data = http_get(
        f"https://api.spotify.com/v1/artists/{artist_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    if not data or "followers" not in data:
        # Fallback to user profile endpoint if artist endpoint failed
        data = http_get(
            f"https://api.spotify.com/v1/users/{artist_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

    if data and "followers" in data:
        count = data["followers"]["total"]
        print(f"  ✓ Spotify followers (API): {count:,}")
        return count

    # Fallback to Spotify Web Profile Scraper
    try:
        url = f"https://open.spotify.com/user/{artist_id}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode()
        match = re.search(r'"followers":\s*\{\s*"total":\s*(\d+)', html) or re.search(r'(\d+)\s+Follower', html, re.IGNORECASE)
        if match:
            count = int(match.group(1))
            print(f"  ✓ Spotify followers (web): {count:,}")
            return count
    except Exception as e:
        print(f"  ⚠ Spotify error: {e}", file=sys.stderr)
    return None


def fetch_linkedin() -> int | None:
    token = os.environ.get("LINKEDIN_ACCESS_TOKEN")
    org_id = CONFIG["linkedin_org_id"]
    if not token or org_id == "00000000":
        print("  ⏭ LINKEDIN_ACCESS_TOKEN / org_id not set, skipping.")
        return None
    url = (
        f"https://api.linkedin.com/v2/networkSizes/urn:li:organization:{org_id}"
        f"?edgeType=CompanyFollowedByMember"
    )
    data = http_get(url, headers={"Authorization": f"Bearer {token}"})
    if data and "firstDegreeSize" in data:
        count = data["firstDegreeSize"]
        print(f"  ✓ LinkedIn followers: {count:,}")
        return count
    return None


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────

def main():
    print("🔄 Fetching Kins social stats…\n")
    current = load_current()

    def safe_update(platform: str, label: str, fetcher):
        prev_val = current.get(platform, {}).get("followers", 0)
        result = fetcher()
        current[platform] = {
            "followers": result if result is not None else prev_val,
            "label": label,
            "stale": result is None,
        }

    safe_update("youtube",    "subscribers",        fetch_youtube)
    safe_update("twitch",     "followers",           fetch_twitch)
    safe_update("instagram",  "followers",           fetch_instagram)
    safe_update("twitter",    "followers",           fetch_twitter)
    safe_update("tiktok",     "followers",           fetch_tiktok)
    safe_update("soundcloud", "followers",           fetch_soundcloud)
    safe_update("spotify",    "monthly listeners",   fetch_spotify)
    safe_update("linkedin",   "followers",           fetch_linkedin)

    # YT Music is not independently fetchable — same as YouTube
    current["ytmusic"] = current.get("ytmusic", {"followers": 1200000, "label": "streams"})

    output = {
        "last_updated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "platforms": current,
    }

    with open(FOLLOWERS_FILE, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n✅ followers.json updated at {output['last_updated']}")


if __name__ == "__main__":
    main()
