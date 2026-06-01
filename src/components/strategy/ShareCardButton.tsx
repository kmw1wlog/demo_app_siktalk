"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShareCardButton() {
  const [message, setMessage] = useState("");

  return (
    <div className="inline-flex flex-col gap-1">
      <Button
        variant="secondary"
        onClick={() => setMessage("공유 이미지는 현재 MVP 데모 상태입니다. 전략 카드는 그대로 저장할 수 있습니다.")}
      >
        공유 이미지 만들기
      </Button>
      {message ? <span className="text-xs text-slate-500">{message}</span> : null}
    </div>
  );
}
