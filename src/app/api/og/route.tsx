import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

const DEFAULT_PHOTO = "/images/postcards/spanish-beach.jpg";

function absolutePhotoUrl(request: NextRequest, photo: string): string {
  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }
  const path = photo.startsWith("/") ? photo : `/${photo}`;
  return new URL(path, request.nextUrl.origin).toString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = (searchParams.get("title") || "Let's Catchup").slice(0, 80);
  const from = (searchParams.get("from") || "A friend").slice(0, 40);
  const photoParam = searchParams.get("photo") || DEFAULT_PHOTO;
  // Only allow same-origin relative paths or http(s) — avoid odd schemes
  const photo =
    photoParam.startsWith("/") || photoParam.startsWith("http")
      ? photoParam
      : DEFAULT_PHOTO;
  const photoUrl = absolutePhotoUrl(request, photo);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#c9dde8",
          padding: 36,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRadius: 18,
            overflow: "hidden",
            background: "#f7f3ec",
            boxShadow: "0 18px 40px rgba(31, 79, 92, 0.28)",
            border: "1px solid rgba(31, 79, 92, 0.12)",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              position: "relative",
              minHeight: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt=""
              width={1200}
              height={630}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "28px 32px 32px",
              background: "#f7f3ec",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 18,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#5a7a86",
              }}
            >
              Postcard invite
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 48,
                lineHeight: 1.15,
                color: "#1f2a2e",
                fontWeight: 600,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#4a646e",
              }}
            >
              from {from}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
