"use client";

import { useMemo, useState } from "react";
import { Plus, BedDouble, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useApp } from "@/store/app-store";

import {
  bedTint, computeHostelStats,
  type Bed, type Block, type Floor, type Hostel, type HostelData, type Room,
} from "./types";
import { AddHostelDialog, AllocateDialog, NameDialog, ToolButton } from "./hostel-dialogs";

type Props = { data: HostelData | null; onChanged: () => void };

export function HostelTreeTab({ data, onChanged }: Props) {
  const { t } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const hostels = data?.hostels ?? [];

  if (hostels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md ring-1 ring-white/30">
          <Building2 className="size-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{t("hostel.empty")}</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{t("hostel.emptyDesc")}</p>
        <Button
          className="mt-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-4" />
          {t("hostel.addHostel")}
        </Button>
        <AddHostelDialog open={addOpen} onOpenChange={setAddOpen} onSaved={onChanged} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-4" />
          {t("hostel.addHostel")}
        </Button>
      </div>

      {hostels.map((h) => (
        <HostelCard key={h.id} hostel={h} onChanged={onChanged} />
      ))}

      <AddHostelDialog open={addOpen} onOpenChange={setAddOpen} onSaved={onChanged} />
    </div>
  );
}

function HostelCard({ hostel, onChanged }: { hostel: Hostel; onChanged: () => void }) {
  const { t } = useApp();
  const stats = useMemo(() => computeHostelStats(hostel), [hostel]);

  return (
    <Collapsible defaultOpen className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 px-4 py-4 text-start hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{hostel.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("hostel.occupancy")}: {stats.occupied}/{stats.total} · {stats.pct}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
            {t("hostel.vacant")}: {stats.vacant}
          </Badge>
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
            {t("hostel.occupied")}: {stats.occupied}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t bg-muted/20 p-4 space-y-4">
          {hostel.blocks.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("hostel.noBeds")}</p>
          ) : (
            hostel.blocks.map((b) => (
              <BlockView key={b.id} block={b} onChanged={onChanged} />
            ))
          )}
          <AddBlockButton hostelId={hostel.id} onChanged={onChanged} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AddBlockButton({ hostelId, onChanged }: { hostelId: string; onChanged: () => void }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <ToolButton icon={<Plus className="size-3" />} label={t("hostel.addBlock")} onClick={() => setOpen(true)} />
      <NameDialog
        open={open}
        onOpenChange={setOpen}
        title={t("hostel.addBlock")}
        label={t("hostel.blockName")}
        placeholder={t("hostel.blockName")}
        successKey="hostel.blockCreated"
        onSubmit={async (name) => {
          const res = await fetch("/api/hostel/block", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hostelId, name }),
          });
          const json = await res.json();
          if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
          onChanged();
        }}
      />
    </>
  );
}

function BlockView({ block, onChanged }: { block: Block; onChanged: () => void }) {
  const { t } = useApp();
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-sm font-semibold mb-2">{block.name}</p>
      {block.floors.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("hostel.noBeds")}</p>
      ) : (
        <div className="space-y-3">
          {block.floors.map((f) => (
            <FloorView key={f.id} floor={f} onChanged={onChanged} />
          ))}
        </div>
      )}
      <AddFloorButton blockId={block.id} onChanged={onChanged} />
    </div>
  );
}

function AddFloorButton({ blockId, onChanged }: { blockId: string; onChanged: () => void }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState("1");
  return (
    <div className="mt-2">
      <ToolButton icon={<Plus className="size-3" />} label={t("hostel.addFloor")} onClick={() => setOpen(true)} />
      <NameDialog
        open={open}
        onOpenChange={setOpen}
        title={t("hostel.addFloor")}
        label={t("hostel.floorLevel")}
        type="number"
        successKey="hostel.floorCreated"
        extraLabel=""
        extraValue={level}
        onExtraChange={setLevel}
        onSubmit={async (_n, lvl) => {
          const res = await fetch("/api/hostel/floor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blockId, level: Number(lvl ?? level) }),
          });
          const json = await res.json();
          if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
          onChanged();
        }}
      />
    </div>
  );
}

function FloorView({ floor, onChanged }: { floor: Floor; onChanged: () => void }) {
  return (
    <div className="rounded-md border bg-muted/10 p-2">
      <p className="text-xs font-semibold text-muted-foreground mb-2">L{floor.level}</p>
      {floor.rooms.length === 0 ? null : (
        <div className="space-y-2">
          {floor.rooms.map((r) => (
            <RoomView key={r.id} room={r} onChanged={onChanged} />
          ))}
        </div>
      )}
      <AddRoomButton floorId={floor.id} onChanged={onChanged} />
    </div>
  );
}

function AddRoomButton({ floorId, onChanged }: { floorId: string; onChanged: () => void }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [capacity, setCapacity] = useState("4");
  return (
    <div className="mt-2">
      <ToolButton icon={<Plus className="size-3" />} label={t("hostel.addRoom")} onClick={() => setOpen(true)} />
      <NameDialog
        open={open}
        onOpenChange={setOpen}
        title={t("hostel.addRoom")}
        label={t("hostel.roomNumber")}
        type="text"
        placeholder={t("hostel.roomNumber")}
        successKey="hostel.roomCreated"
        extraLabel={t("hostel.capacity")}
        extraValue={capacity}
        onExtraChange={setCapacity}
        onSubmit={async (roomNumber, cap) => {
          const res = await fetch("/api/hostel/room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ floorId, roomNumber, capacity: Number(cap ?? capacity) }),
          });
          const json = await res.json();
          if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
          onChanged();
        }}
      />
    </div>
  );
}

function RoomView({ room, onChanged }: { room: Room; onChanged: () => void }) {
  const { t } = useApp();
  return (
    <div className="rounded-md border bg-background p-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium">{t("hostel.roomNumber")}: {room.roomNumber}</p>
        <Badge variant="outline" className="text-[10px]">
          {t("hostel.capacity")}: {room.capacity}
        </Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {room.beds.map((bed) => (
          <BedTile key={bed.id} bed={bed} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}

function BedTile({ bed, onChanged }: { bed: Bed; onChanged: () => void }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const student = bed.allocations[0]?.student;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group rounded-lg border px-2 py-1.5 text-xs transition-all hover:-translate-y-0.5 hover:shadow-md text-start ${bedTint(bed.status)}`}
        title={bed.bedNumber}
      >
        <div className="flex items-center gap-1">
          <BedDouble className="size-3 shrink-0" />
          <span className="font-medium truncate">{bed.bedNumber}</span>
        </div>
        <div className="text-[10px] truncate opacity-80">
          {student ? student.name : bed.status === "maintenance" ? t("hostel.maintenance") : t("hostel.vacant")}
        </div>
      </button>
      <AllocateDialog
        open={open}
        onOpenChange={setOpen}
        bed={bed}
        onChanged={onChanged}
      />
    </>
  );
}
