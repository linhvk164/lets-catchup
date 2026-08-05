"use client";

import Image from "next/image";
import { DEFAULT_POSTCARD_PHOTOS } from "@/lib/photos";
import type { PostcardPhoto } from "@/lib/types";

export function PhotoPicker({
  value,
  onChange,
}: {
  value: PostcardPhoto;
  onChange: (photo: PostcardPhoto) => void;
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

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">Postcard photo</p>
      <div className="grid grid-cols-3 gap-2">
        {DEFAULT_POSTCARD_PHOTOS.map((photo) => {
          const active = !value.dataUrl && value.src === photo.src;
          return (
            <button
              key={photo.src}
              type="button"
              onClick={() => onChange({ ...photo })}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition ${
                active ? "border-ocean" : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.caption}
                fill
                className="object-cover"
                sizes="120px"
                unoptimized
              />
            </button>
          );
        })}
      </div>
      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-ink/20 bg-white/40 px-4 py-3 text-sm text-ink-soft hover:bg-white/70">
        Upload your own photo
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
      </label>
      {value.dataUrl ? (
        <p className="text-xs text-ink-soft">
          Custom photo saved on this device. Shared links use the selected default for friends.
        </p>
      ) : null}
    </div>
  );
}
