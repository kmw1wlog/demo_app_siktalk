"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function WaitlistForm({
  onSubmit,
}: {
  onSubmit: (email: string, topChoice: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [topChoice, setTopChoice] = useState(true);
  const [notify, setNotify] = useState(true);
  const [share, setShare] = useState(false);

  return (
    <div className="space-y-3">
      <Input
        type="email"
        placeholder="이메일을 입력해주세요"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <label className="flex gap-2 text-sm text-slate-700">
        <input checked={topChoice} onChange={(event) => setTopChoice(event.target.checked)} type="checkbox" />
        이 플랫폼을 가장 원해요
      </label>
      <label className="flex gap-2 text-sm text-slate-700">
        <input checked={notify} onChange={(event) => setNotify(event.target.checked)} type="checkbox" />
        출시 알림을 받고 싶어요
      </label>
      <label className="flex gap-2 text-sm text-slate-700">
        <input checked={share} onChange={(event) => setShare(event.target.checked)} type="checkbox" />
        이 전략 카드 공유에도 동의해요
      </label>
      <Button
        className="w-full"
        onClick={() => onSubmit(email, topChoice)}
        disabled={!email.includes("@") || (!notify && !topChoice && !share)}
      >
        대기 등록하기
      </Button>
    </div>
  );
}
