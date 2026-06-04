"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function WaitlistForm({
  onSubmit,
}: {
  onSubmit: (topChoice: boolean, notify: boolean, share: boolean) => void;
}) {
  const [topChoice, setTopChoice] = useState(true);
  const [notify, setNotify] = useState(true);
  const [share, setShare] = useState(false);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">
        <p className="font-black text-slate-900">기능 문의</p>
        <p className="mt-1">
          피드백 메일:
          {" "}
          <a href="mailto:issue.research777@gmail.com" className="font-black text-emerald-700">
            issue.research777@gmail.com
          </a>
        </p>
      </div>
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
        onClick={() => onSubmit(topChoice, notify, share)}
        disabled={!notify && !topChoice && !share}
      >
        대기 등록하기
      </Button>
    </div>
  );
}
