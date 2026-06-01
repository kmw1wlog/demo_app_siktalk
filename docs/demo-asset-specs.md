# SikTalk Demo Asset Specs

## Counts

- Condition images: 6
- Library main video: 1
- Library related images: 2 reused from the 6 condition images
- Extra paid assets: 0

## Shared Ratio

Use `16:9` for all demo visual assets. The app uses the same ratio for condition cards, library video, and related thumbnails.

## Condition Images

- Request size: `960x540`
- App slot: 3-column desktop grid, full-width mobile cards
- Items:
  - `volume-breakout`: 거래량 급증 돌파
  - `money-rank`: 거래대금 상위 유지
  - `closing-hold`: 종가베팅 고가권 유지
  - `open-retest`: 시초가 돌파 재진입
  - `gap-pullback`: 갭 상승 후 첫 눌림
  - `rsi-bounce`: RSI 과매도 반등

## Library Main Video

- Request size: `1280x720`
- App slot: main player area, `16:9`
- Demo first card: `volume-breakout`
- Recommended duration: 6-8 seconds, seamless loop

## Library Related Images

- Request size: `640x360`
- App slot: right rail thumbnails on desktop, related cards on mobile
- Reuse condition images:
  - `money-rank`
  - `closing-hold`

## Current Layout

- `/conditions`: top two rows are the 6 generated condition image slots.
- `/library`: first asset is the main video area, below it is the platform copy block, right rail shows the 2 related image assets, text explanation is collapsed under the copy block.
