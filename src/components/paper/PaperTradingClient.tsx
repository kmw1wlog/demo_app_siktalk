"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createVirtualCandles, paperSignal } from "@/lib/paper-trading";
import { addEvent } from "@/lib/storage";
import { createId } from "@/lib/id";
import type { PaperTrade } from "@/lib/types";

const initialCash = 10_000_000;

export function PaperTradingClient() {
  const candles = useMemo(() => createVirtualCandles(), []);
  const [cursor, setCursor] = useState(24);
  const [cash, setCash] = useState(initialCash);
  const [quantity, setQuantity] = useState(0);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const current = candles[cursor];
  const signal = paperSignal(candles, cursor);
  const equity = cash + quantity * current.close;
  const pnlPct = ((equity - initialCash) / initialCash) * 100;

  useEffect(() => {
    addEvent({ type: "paper_trading_opened", createdAt: new Date().toISOString() });
  }, []);

  function nextCandle(step = 1) {
    setCursor((value) => Math.min(candles.length - 1, value + step));
  }

  function buy() {
    const budget = Math.min(cash, 1_000_000);
    const nextQuantity = Math.floor(budget / current.close);
    if (nextQuantity <= 0) return;
    setCash((value) => value - nextQuantity * current.close);
    setQuantity((value) => value + nextQuantity);
    recordTrade("buy", nextQuantity);
  }

  function sell() {
    if (quantity <= 0) return;
    setCash((value) => value + quantity * current.close);
    recordTrade("sell", quantity);
    setQuantity(0);
  }

  function recordTrade(side: PaperTrade["side"], amount: number) {
    const trade = {
      id: createId("paper"),
      side,
      price: current.close,
      quantity: amount,
      createdAt: new Date().toISOString(),
    };
    setTrades((value) => [trade, ...value]);
    addEvent({ type: "paper_trade_executed", side, price: current.close, createdAt: trade.createdAt });
  }

  return (
    <div className="mx-auto w-[calc(100vw-4rem)] max-w-full space-y-5 md:w-full md:max-w-5xl">
      <section className="rounded-3xl bg-slate-950 p-6 text-white">
        <p className="text-xs font-bold text-emerald-300">가상 데이터 모의투자</p>
        <h1 className="mt-2 text-3xl font-black">실제 시세 없이 전략 감각 테스트</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          가격, 거래량, ATR은 앱 안에서 만든 가상 데이터입니다. 실제 투자 추천이나 실거래 기능이 아닙니다.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500">현재가</p>
              <h2 className="text-3xl font-black text-slate-950">{current.close.toFixed(2)}</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">{signal}</span>
          </div>
          <div className="flex h-48 items-end gap-1 rounded-2xl bg-slate-50 p-3">
            {candles.slice(cursor - 23, cursor + 1).map((candle) => {
              const height = Math.max(8, (candle.close - 88) * 3);
              const rising = candle.close >= candle.open;
              return (
                <div
                  key={candle.index}
                  className={`flex-1 rounded-t ${rising ? "bg-emerald-500" : "bg-rose-400"}`}
                  style={{ height: `${Math.min(100, height)}%` }}
                  title={`${candle.index}: ${candle.close.toFixed(2)}`}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="ATR" value={current.atr.toFixed(2)} />
            <Metric label="거래량" value={current.volume.toLocaleString("ko-KR")} />
            <Metric label="봉" value={`${cursor + 1}/${candles.length}`} />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Button className="rounded-2xl" onClick={buy}>
              가상 매수
            </Button>
            <Button variant="secondary" className="rounded-2xl" onClick={sell}>
              가상 매도
            </Button>
            <Button variant="ghost" className="rounded-2xl" onClick={() => nextCandle()}>
              다음 봉
            </Button>
            <Button variant="ghost" className="rounded-2xl" onClick={() => nextCandle(20)}>
              20봉 진행
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-black text-slate-950">계좌</h2>
          <Metric label="총 평가" value={`${Math.round(equity).toLocaleString("ko-KR")}원`} />
          <Metric label="수익률" value={`${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`} />
          <Metric label="현금" value={`${Math.round(cash).toLocaleString("ko-KR")}원`} />
          <Metric label="보유 수량" value={`${quantity.toLocaleString("ko-KR")}주`} />
          <div>
            <h3 className="mb-2 text-sm font-black text-slate-950">체결 기록</h3>
            <div className="space-y-2">
              {trades.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">아직 체결이 없습니다.</p>
              ) : (
                trades.slice(0, 5).map((trade) => (
                  <div key={trade.id} className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                    {trade.side === "buy" ? "매수" : "매도"} {trade.quantity}주 · {trade.price.toFixed(2)}
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}
