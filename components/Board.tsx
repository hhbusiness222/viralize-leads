"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { setStage } from "../app/actions";

export type BoardCard = { id: string; stage: string; value: number; node: React.ReactNode };
export type BoardCol = { key: string; label: string; color: string };

const money = (n: number) => (n ? "$" + Math.round(n).toLocaleString("en-CA") : "$0");

function Card({ card, justDragged }: { card: BoardCard; justDragged: React.MutableRefObject<boolean> }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={"drag" + (isDragging ? " ghost" : "")}
      onClickCapture={(e) => {
        if (justDragged.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {card.node}
    </div>
  );
}

function Column({ col, cards, justDragged }: { col: BoardCol; cards: BoardCard[]; justDragged: React.MutableRefObject<boolean> }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  const total = cards.reduce((a, c) => a + (c.value || 0), 0);
  return (
    <div ref={setNodeRef} className={"col" + (isOver ? " over" : "")} style={{ ["--c" as any]: col.color }}>
      <div className="ch">
        <b>{col.label}</b>
        <span className="meta">{cards.length} · {money(total)}</span>
      </div>
      <div className="cards">
        {cards.length === 0 ? (
          <div className="small drop-hint">{isOver ? "Drop here" : "Empty"}</div>
        ) : (
          cards.map((c) => <Card key={c.id} card={c} justDragged={justDragged} />)
        )}
      </div>
    </div>
  );
}

export default function Board({ cols, cards: initial }: { cols: BoardCol[]; cards: BoardCard[] }) {
  const router = useRouter();
  const [cards, setCards] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const justDragged = useRef(false);

  useEffect(() => setCards(initial), [initial]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  function onStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    justDragged.current = true;
    try { navigator.vibrate?.(15); } catch {}
  }

  function onEnd(e: DragEndEvent) {
    setActiveId(null);
    setTimeout(() => (justDragged.current = false), 50);
    const id = String(e.active.id);
    const to = e.over ? String(e.over.id) : null;
    const card = cards.find((c) => c.id === id);
    if (!card || !to || card.stage === to) return;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage: to } : c)));
    const fd = new FormData();
    fd.set("id", id);
    fd.set("stage", to);
    startTransition(async () => {
      try {
        await setStage(fd);
      } finally {
        router.refresh();
      }
    });
  }

  const active = activeId ? cards.find((c) => c.id === activeId) : null;

  return (
    <DndContext autoScroll={{ acceleration: 3, threshold: { x: 0.12, y: 0.1 } }} sensors={sensors} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => { setActiveId(null); justDragged.current = false; }}>
      <div className={"board" + (activeId ? " dragging" : "")}>
        {cols.map((col) => (
          <Column key={col.key} col={col} cards={cards.filter((c) => c.stage === col.key)} justDragged={justDragged} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>{active ? <div className="drag lifted">{active.node}</div> : null}</DragOverlay>
    </DndContext>
  );
}
