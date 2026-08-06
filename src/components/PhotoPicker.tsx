"use client";

import Image from "next/image";
import { DEFAULT_POSTCARD_PHOTOS } from "@/lib/photos";
import type { PostcardPhoto } from "@/lib/types";

export function PhotoPicker({
  value,
  onChange,
  compact = false,
  focused = false,
  onInteract,
}: {
  value: PostcardPhoto;
  onChange: (photo: PostcardPhoto) => void;
  compact?: boolean;
  /** Full-screen photo step: larger grid + credits. */
  focused?: boolean;
  onInteract?: () => void;
}) {
  function onUpload(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      onChange({
        src: value.src,
        caption: value.caption || "Our moment",
        credit: "Your photo",
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  }

  const selected = value.dataUrl
    ? value
    : DEFAULT_POSTCARD_PHOTOS.find((p) => p.src === value.src) ?? value;

  return (
    <div
      className={
        focused ? "space-y-4" : compact ? "space-y-2" : "max-w-[14rem] space-y-2"
      }
      onPointerDown={() => onInteract?.()}
    >
      {!compact && !focused ? (
        <p className="text-sm font-medium text-ink">Postcard photo</p>
      ) : null}

      {focused ? (
        <p className="text-sm font-medium text-ink">Featured photos</p>
      ) : null}

      <div
        className={`grid gap-2 ${
          focused
            ? "grid-cols-3"
            : compact
              ? "grid-cols-4 gap-1.5"
              : "grid-cols-3 gap-1.5"
        }`}
      >
        {DEFAULT_POSTCARD_PHOTOS.map((photo) => {
          const active = !value.dataUrl && value.src === photo.src;
          return (
            <button
              key={photo.src}
              type="button"
              onClick={() => onChange({ ...photo })}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition ${
                active
                  ? "border-ocean"
                  : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.caption}
                fill
                className="object-cover"
                sizes={focused ? "120px" : "72px"}
                unoptimized
              />
            </button>
          );
        })}
      </div>

      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-ink/20 bg-white/50 text-ink-soft transition hover:bg-white/80 ${
          focused ? "gap-1 px-4 py-6 text-sm" : "px-2.5 py-2 text-xs"
        }`}
      >
        <span className={focused ? "font-medium text-ink" : undefined}>
          {focused || compact ? "Upload photo" : "Upload your own"}
        </span>
        {focused ? (
          <span className="text-xs">JPG or PNG from your camera roll</span>
        ) : null}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
      </label>

      {focused && selected?.credit ? (
        <p className="text-xs text-ink-soft">
          {selected.caption ? (
            <>
              <span className="font-medium text-ink">{selected.caption}</span>
              {" · "}
            </>
          ) : null}
          {selected.credit}
        </p>
      ) : null}

      {value.dataUrl ? (
        <p className="text-[11px] text-ink-soft">
          Custom photo saved on this device. Shared links use the selected
          default for friends.
        </p>
      ) : null}
    </div>
  );
}
