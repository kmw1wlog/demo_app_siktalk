# Telegram Bot MVP

## 목적

- 식톡 전략 카드, TradingView webhook, 테스트 알림을 Telegram으로 전송합니다.
- 이 기능은 투자 추천이 아니라 사용자가 설정한 관찰 조건 감지 알림입니다.
- 실거래 주문, 자동매매, 수익 보장 기능은 포함하지 않습니다.

## 환경변수

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_DEFAULT_CHAT_ID`
- `TRADINGVIEW_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_BASE_URL`

선택:

- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_BOT_USERNAME`

레거시 fallback:

- `TELEGRAM_CHAT_ID`

## 구현 위치

- `src/lib/telegram.ts`
- `src/lib/telegramMessage.ts`
- `src/app/api/telegram/send-test/route.ts`
- `src/app/api/telegram/export/route.ts`
- `src/app/api/webhooks/tradingview/route.ts`
- `src/components/platform/PlatformCarryPanel.tsx`

## API

### 테스트 알림

- `POST /api/telegram/send-test`

예시 body:

```json
{
  "strategyName": "거래량 돌파 + RSI 반등",
  "market": "코인",
  "symbol": "BINANCE:BTCUSDT",
  "timeframe": "5m"
}
```

### TradingView webhook

- `POST /api/webhooks/tradingview?secret=...`

예시 body:

```json
{
  "secret": "same-as-env",
  "source": "tradingview",
  "app": "siktok",
  "event": "strategy_condition_detected",
  "strategyName": "거래량 돌파 + RSI 반등",
  "signalType": "observe",
  "exchange": "{{exchange}}",
  "ticker": "{{ticker}}",
  "interval": "{{interval}}",
  "price": "{{close}}",
  "volume": "{{volume}}",
  "time": "{{time}}"
}
```

## UI 동작

- `Telegram` 탭:
  - 테스트 알림 보내기
  - Webhook URL 복사
  - TradingView 메시지 JSON 복사
- `TradingView Pine` 탭:
  - Webhook URL 복사
  - TradingView 메시지 JSON 복사
  - 7단계 연결 안내

## 체크리스트

로컬:

1. `.env.local`에 Telegram/TradingView 환경변수를 채웁니다.
2. `npm run build`
3. `npm run start`
4. `/app` 또는 `/library`에서 `플랫폼별 퍼가기 > Telegram` 탭을 엽니다.
5. `테스트 알림 보내기` 클릭 후 Telegram 수신 여부를 확인합니다.
6. `Webhook URL 복사`, `TradingView 메시지 JSON 복사`가 동작하는지 확인합니다.

배포:

1. 배포 환경변수에 동일 값을 설정합니다.
2. `NEXT_PUBLIC_APP_BASE_URL`을 실제 배포 URL로 바꿉니다.
3. TradingView alert의 Webhook URL에 식톡 URL을 넣습니다.
4. Message에 식톡 JSON 초안을 넣습니다.
5. Telegram 수신을 확인합니다.

## 보안 메모

- Bot token은 클라이언트 번들에 노출하지 않습니다.
- 현재 MVP는 secret 기반 webhook URL을 서버에서 생성해 클라이언트에 전달합니다.
- 프로덕션에서는 사용자별 webhook token 또는 서명 구조로 바꾸는 편이 맞습니다.
