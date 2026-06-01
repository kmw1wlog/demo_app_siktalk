# SikTalk Demo Asset Specs

## Counts

- Condition images: handled outside this app pass
- Library list-card videos: one small loop per visible library card
- Extra paid assets: 0

## Shared Ratio

Use `16:9` for library card video slots. The app currently renders small list-card video placeholders.

## Condition Images

- `/conditions` is back to the original searchable condition explorer.
- Generated image prompts for conditions should be handled separately when Gemini instructions are finalized.

## Library List Videos

- Request size: `640x360`
- App slot: left side of each library list card on desktop, top of each card on mobile
- Recommended duration: 4-6 seconds, seamless loop
- First visible examples should match the first few strategy cards in `/library`.

## Current Layout

- `/conditions`: hero, search, category filters, market filters, then the original condition gallery.
- `/library`: list cards. Each card has a small video slot, numbered `진입/청산/종목/필터` steps, then a visible copy-ready condition draft block.
