"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { conversionPlatformLabel } from "@/lib/format";
import { createId } from "@/lib/id";
import { addConversionRequest, addEvent, saveStrategy } from "@/lib/storage";
import type { ConversionPlatform, StrategyCard } from "@/lib/types";
import { WaitlistForm } from "./WaitlistForm";

export function FakeDoorModal({
  strategy,
  platform,
  open,
  onClose,
}: {
  strategy: StrategyCard;
  platform: ConversionPlatform;
  open: boolean;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const label = conversionPlatformLabel(platform);

  function submit(email: string, topChoice: boolean) {
    const createdAt = new Date().toISOString();
    addEvent({ type: "waitlist_submitted", strategyId: strategy.id, platform, email, createdAt });
    addConversionRequest({
      id: createId("waitlist"),
      strategyId: strategy.id,
      platform,
      strategyType: strategy.strategyType,
      requestedSection: "full",
      email,
      createdAt,
      source: "card",
      intentLevel: topChoice ? "topChoice" : "waitlist",
    });
    setMessage("대기 등록이 완료되었습니다.");
  }

  function saveOnly() {
    saveStrategy({ ...strategy, isSaved: true });
    setMessage("현재는 문장형 전략 카드로 저장했습니다.");
  }

  return (
    <Modal open={open} title="아직 개발 전인 베타 기능입니다" onClose={onClose}>
      <div className="space-y-4">
        <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
          {`이 기능은 현재 베타 수요를 확인 중입니다.
이 전략을 ${label} 형식으로 변환하고 싶다면 대기 등록해주세요.
요청이 많은 플랫폼부터 실제 변환 기능을 개발합니다.`}
        </p>
        <p className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          현재 버튼은 실제 변환 결과를 제공하지 않습니다. 사용자의 요청 데이터는 개발 우선순위 판단에만 사용됩니다.
        </p>
        <WaitlistForm onSubmit={submit} />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={saveOnly}>현재는 전략 카드로 저장하기</Button>
          <Button variant="ghost" onClick={onClose}>닫기</Button>
        </div>
        {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
      </div>
    </Modal>
  );
}
