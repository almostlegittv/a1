# Popular game catalog source findings

## Findings

Microsoft’s official Xbox Services API documentation describes Xbox services APIs and REST endpoints for Xbox services, authentication, and game/app scenarios, but it is not presented as a public storefront-popularity feed for a general booking website. The official Xbox games page does expose public sections such as New releases and Best sellers, but consuming those pages directly would be scraping and would not provide a stable application contract.

PlayStation’s official support documentation explains how users access the PlayStation Plus Game Catalog on PS4 and PS5 consoles. It does not expose a general public developer API for a cross-platform popular-games feed. The PlayStation editorial pages can provide curated lists, but they are not a stable catalog API.

IGDB provides game metadata, platform filtering, sorting, and popularity-related fields through a server-side API. Its documentation requires a Twitch developer account, client ID, and client secret, notes that browser-direct calls are blocked by CORS, and states that the free API is for non-commercial use unless a commercial partnership is arranged.

RAWG provides a server-side API with platform filters and ordering fields such as added, rating, and metacritic. Its documentation requires an API key, requires attribution/backlinks, prohibits data redistribution, and distinguishes personal/hobby and commercial plans.

## Safe product boundary

The site should not pretend that Xbox or PlayStation is authorizing the booking catalog. The external data source should be described as game metadata and discovery information only. Creator approval remains the authority for whether a title appears in a specific creator’s request catalog, and ownership remains creator-confirmed after a request. No external catalog integration should expose checkout, wallet balances, gift codes, payment details, or platform transaction status.

## Recommended implementation direction

Use a server-side metadata provider, preferably IGDB if the project will remain non-commercial and the owner can supply Twitch developer credentials, or RAWG if its licensing and attribution terms fit the intended launch. Cache and normalize only the fields needed by the existing catalog schema: title, platform, genre, release date, popularity score, and optional artwork URL. Do not call the provider directly from the browser. If no provider credentials are available, keep the current admin-managed catalog as the fallback rather than scraping official storefront pages.

## Sources

- https://learn.microsoft.com/en-us/gaming/gdk/docs/services/fundamentals/xbox-services-api/live-introduction-to-xbox-live-apis?view=gdk-2604
- https://www.xbox.com/en-US/games
- https://www.playstation.com/en-us/support/subscriptions/ps-plus-game-catalog/
- https://api-docs.igdb.com/
- https://rawg.io/apidocs
- https://api.rawg.io/docs/
