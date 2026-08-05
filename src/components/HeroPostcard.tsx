export function HeroPostcard() {
  return (
    <div className="relative mx-auto w-full max-w-[320px] animate-float">
      <div className="absolute -left-2 top-10 hidden h-24 w-24 rounded-full bg-sky/40 blur-2xl sm:block" />
      <div className="absolute -right-4 bottom-8 hidden h-28 w-28 rounded-full bg-gold/25 blur-2xl sm:block" />

      <div className="paper-card paper-texture relative rotate-[-1.5deg] rounded-2xl p-3 shadow-[0_24px_60px_rgba(31,79,92,0.2)] sm:p-4">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,#a8c9d8,transparent_42%),radial-gradient(circle_at_85%_20%,#e0c09a,transparent_38%),linear-gradient(165deg,#7aa3b3,#2f6f7e_50%,#1e3340)]" />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div className="flex justify-between">
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-white/75">
                One Postcard Away
              </p>
              <div className="h-12 w-10 rotate-3 rounded-sm border border-dashed border-white/50 bg-white/15" />
            </div>

            <div>
              <svg className="h-14 w-full" viewBox="0 0 320 56" fill="none" aria-hidden>
                <path
                  d="M36 36 C 100 8, 220 8, 284 36"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="1.5"
                  strokeDasharray="4 5"
                  className="animate-thread"
                />
                <circle cx="36" cy="36" r="5" fill="#f8f4ec" className="animate-pin" />
                <circle cx="36" cy="36" r="2.5" fill="#b85c45" />
                <circle
                  cx="284"
                  cy="36"
                  r="5"
                  fill="#f8f4ec"
                  className="animate-pin"
                  style={{ animationDelay: "0.25s" }}
                />
                <circle cx="284" cy="36" r="2.5" fill="#b85c45" />
              </svg>
              <div className="mt-1 flex justify-between text-[11px] text-white/90">
                <span>Toronto 🇨🇦</span>
                <span>Berlin 🇩🇪</span>
              </div>
              <p className="mt-4 font-display text-xl text-white">One Postcard Away</p>
              <p className="mt-1 text-[11px] text-white/75">Photography by Connie Kang</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
