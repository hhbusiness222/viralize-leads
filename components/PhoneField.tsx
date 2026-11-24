"use client";
import { useEffect, useRef, useState } from "react";

type Hit = { id: string; business: string; rep: string; stage: string };

export default function PhoneField() {
  const [phone, setPhone] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const t = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(t.current);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) { setHits([]); return; }
    t.current = setTimeout(async () => {
      try {
        const r = await fetch("/api/dupe?phone=" + encodeURIComponent(phone));
        if (r.ok) setHits(await r.json());
      } catch {}
    }, 350);
  }, [phone]);

  return (
    <div>
      <label>Phone *</label>
      <input name="phone" required inputMode="tel" placeholder="613 555 0199" value={phone} onChange={(e) => setPhone(e.target.value)} />
      {hits.length > 0 && (
        <div className="dupe">
          <b>Already in the app:</b>
          {hits.map((h) => (
            <a key={h.id} href={`/lead/${h.id}`} target="_blank" rel="noreferrer">
              {h.business} · {h.stage} · {h.rep || "no owner"}
            </a>
          ))}
          <label className="dupe-force">
            <input type="checkbox" name="force_dupe" value="1" required /> It&apos;s a different business, add it anyway
          </label>
        </div>
      )}
    </div>
  );
}
