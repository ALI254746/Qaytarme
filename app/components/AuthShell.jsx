import Link from "next/link";

function SearchMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
      <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="2.6" />
      <path d="m16 16 5 5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function WireframeIcon({ kind }) {
  if (kind === "camera") {
    return (
      <svg viewBox="0 0 160 112" fill="none" aria-hidden="true" className="h-full w-full">
        <path d="M25 36h24l9-12h39l10 12h25a8 8 0 0 1 8 8v43a8 8 0 0 1-8 8H25a8 8 0 0 1-8-8V44a8 8 0 0 1 8-8Z" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="81" cy="64" r="23" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="81" cy="64" r="14" stroke="currentColor" strokeWidth="2" />
        <path d="M117 48h13M29 28l9-11h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "watch") {
    return (
      <svg viewBox="0 0 160 112" fill="none" aria-hidden="true" className="h-full w-full">
        <path d="m62 19 5 18m26-18-5 18m-21 40-5 18m26-18 5 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <rect x="48" y="33" width="64" height="49" rx="12" stroke="currentColor" strokeWidth="2.5" />
        <rect x="57" y="41" width="46" height="33" rx="7" stroke="currentColor" strokeWidth="2" />
        <path d="M80 48v10l8 5m-8-5-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 112" fill="none" aria-hidden="true" className="h-full w-full">
      <path d="M36 34h82v48H36z" stroke="currentColor" strokeWidth="2.5" />
      <path d="m36 34 41 24 41-24M77 58v24M49 25h57l12 9H36l13-9Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="m60 42 17 10 17-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const recentItems = [
  { name: "Avtomobil kaliti", location: "Namangan, Chortoq", time: "1 hafta oldin", icon: "key" },
  { name: "Canon kamera", location: "Toshkent, Chilonzor", time: "4 kun oldin", icon: "camera" },
  { name: "Apple Watch", location: "Andijon, Shahrixon", time: "2 kun oldin", icon: "watch" },
];

export default function AuthShell({ mode, eyebrow, title, description, children }) {
  const isRegister = mode === "register";

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#171717] lg:grid lg:grid-cols-[minmax(0,1.58fr)_minmax(440px,0.92fr)]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-[#d8d8d8] bg-[#eeeeee] px-10 py-9 lg:flex lg:flex-col xl:px-[4vw] xl:py-10 [@media(max-height:850px)]:py-5">
        <div className="pointer-events-none absolute -right-32 top-[-18rem] h-[42rem] w-[42rem] rounded-full border border-[#d4d4d4]" />
        <div className="pointer-events-none absolute -right-8 top-[-12rem] h-[34rem] w-[34rem] rounded-full border border-[#dadada]" />
        <div className="pointer-events-none absolute right-[6%] top-[17%] h-[390px] w-[390px] rounded-full border border-dashed border-[#c8c8c8]" />
        <div className="pointer-events-none absolute right-[12%] top-[22%] h-[310px] w-[310px] rounded-full border border-[#dedede]" />

        <header className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="QaytarMe bosh sahifa">
            <span className="grid h-14 w-14 place-items-center rounded-[15px] bg-[#242424] text-white">
              <SearchMark />
            </span>
            <span className="text-[28px] font-extrabold tracking-[-0.06em]">QaytarMe</span>
          </Link>
          <p className="max-w-28 text-sm leading-5 text-[#686868]">
            Yo&apos;qotmang,
            <br />
            qaytaring.
          </p>
        </header>

        <div className="pointer-events-none absolute right-[9%] top-[21%] z-0 hidden h-[280px] w-[320px] xl:block" aria-hidden="true">
          <svg viewBox="0 0 320 280" fill="none" className="h-full w-full text-[#bcbcbc]">
            <path d="M61 72c-35 6-52 27-41 47 13 24 67 20 96 32 31 13 49 32 41 62" stroke="currentColor" strokeWidth="2" strokeDasharray="7 9" />
            <path d="M158 213c5 16 14 25 14 25l13-18m-13 18-20-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="m119 240 40-11 40 11-40 15-40-15Z" fill="#d2d2d2" stroke="currentColor" strokeWidth="2" />
            <path d="M119 240v28l40 13v-26m40-15v28l-40 15m-40-43 40 15 40-15" stroke="currentColor" strokeWidth="2" />
            <circle cx="85" cy="61" r="42" fill="#e7e7e7" />
            <path d="M85 38c-13 0-23 10-23 23 0 16 23 39 23 39s23-23 23-39c0-13-10-23-23-23Z" fill="#bdbdbd" />
            <circle cx="85" cy="61" r="8" fill="#eeeeee" />
          </svg>
        </div>

        <div className="relative z-10 my-auto max-w-[980px] py-10 [@media(max-height:850px)]:py-3">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#777] [@media(max-height:850px)]:mb-2">
            {isRegister ? "Yordam berishdan boshlang" : "Buyumlaringizga qayta yo'l toping"}
          </p>
          <h1 className="max-w-[880px] text-6xl font-black leading-[0.98] tracking-[-0.065em] xl:text-[5.2rem] [@media(max-height:850px)]:text-5xl [@media(max-height:850px)]:leading-[0.94]">
            {isRegister ? (
              <>
                Birgalikda <span className="text-[#999]">topamiz,</span>
                <br />
                qaytaramiz.
              </>
            ) : (
              <>
                Yo&apos;qotilgan
                <br />
                <span className="text-[#999]">buyumlar</span>
                <br />
                qaytarilgan quvonch.
              </>
            )}
          </h1>
          <p className="mt-6 max-w-[580px] text-lg leading-8 text-[#666] xl:text-xl [@media(max-height:850px)]:mt-3 [@media(max-height:850px)]:text-sm [@media(max-height:850px)]:leading-6">
            {isRegister
              ? "QaytarMe hamjamiyatiga qo'shiling. Yo'qolgan buyumni topish yoki egasiga qaytarish shu yerdan boshlanadi."
              : "Yo'qolgan narsalarni e'lon qiling yoki topib olgan buyumlarni egalariga qaytaring. Hammasi oddiy va tez."}
          </p>

          <div className="mt-11 [@media(max-height:850px)]:mt-5">
            <div className="mb-4 flex items-center justify-between [@media(max-height:850px)]:mb-2">
              <h2 className="text-lg font-bold tracking-tight [@media(max-height:850px)]:text-sm">Oxirgi topilgan buyumlar</h2>
              <span className="text-xs font-semibold text-[#777]">NAMUNALAR <span aria-hidden="true">↗</span></span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recentItems.map((item) => (
                <article key={item.name} className="rounded-2xl border border-[#d7d7d7] bg-[#f7f7f7] p-2.5 [@media(max-height:850px)]:rounded-xl [@media(max-height:850px)]:p-2">
                  <div className="relative grid h-28 place-items-center overflow-hidden rounded-xl bg-[#e8e8e8] text-[#747474] [@media(max-height:850px)]:h-20">
                    <div className="absolute inset-2 rounded-lg border border-dashed border-[#d0d0d0]" />
                    <div className="relative h-24 w-32 [@media(max-height:850px)]:h-[4.5rem] [@media(max-height:850px)]:w-24">
                      <WireframeIcon kind={item.icon} />
                    </div>
                    <span className="absolute left-2 top-2 rounded-md bg-[#777] px-2 py-1 text-[9px] font-bold tracking-wide text-white">TOPILDI</span>
                    <span className="absolute right-2 top-2 text-[9px] text-[#666]">{item.time}</span>
                  </div>
                  <h3 className="mt-3 truncate text-sm font-bold [@media(max-height:850px)]:mt-2 [@media(max-height:850px)]:text-xs">{item.name}</h3>
                  <p className="mt-1 truncate text-xs text-[#777] [@media(max-height:850px)]:mt-0.5 [@media(max-height:850px)]:text-[10px]">{item.location}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <footer className="relative z-10 grid grid-cols-3 border-t border-[#d2d2d2] pt-5 [@media(max-height:850px)]:pt-3">
          {[
            ["01", "Toping", "Yo'qolgan buyumni qidiring"],
            ["02", "Bog'laning", "Egasiga yetkazishda yordam bering"],
            ["03", "Yaxshilik ulashing", "Ishonchli hamjamiyat quring"],
          ].map(([number, label, detail], index) => (
            <div key={number} className={`pr-4 ${index > 0 ? "border-l border-[#d2d2d2] pl-5" : ""}`}>
              <span className="text-[10px] font-bold tracking-widest text-[#8a8a8a]">{number}</span>
              <p className="mt-1 text-xs font-bold [@media(max-height:850px)]:mt-0.5">{label}</p>
              <p className="mt-1 text-[10px] leading-4 text-[#777] [@media(max-height:850px)]:mt-0">{detail}</p>
            </div>
          ))}
        </footer>
      </section>

      <section className="flex min-h-screen flex-col justify-center bg-[#fafafa] px-5 py-10 sm:px-10 lg:px-12 xl:px-[4vw] [@media(max-height:850px)]:py-5">
        <div className="mx-auto w-full max-w-[480px]">
          <Link href="/" className="mb-10 inline-flex items-center gap-2.5 lg:hidden" aria-label="QaytarMe bosh sahifa">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#242424] text-white">
              <SearchMark />
            </span>
            <span className="text-2xl font-extrabold tracking-[-0.06em]">QaytarMe</span>
          </Link>
          <div className="mb-7 [@media(max-height:850px)]:mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#858585]">{eyebrow}</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-[2.7rem] [@media(max-height:850px)]:mt-1 [@media(max-height:850px)]:text-3xl">{title}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#717171] sm:text-base [@media(max-height:850px)]:mt-1 [@media(max-height:850px)]:text-sm [@media(max-height:850px)]:leading-5">{description}</p>
          </div>
          {children}
          <p className="mt-10 text-center text-[11px] leading-5 text-[#888] [@media(max-height:850px)]:mt-5">
            © 2026 QaytarMe. Barcha huquqlar himoyalangan.
            <br />
            <span className="italic">Yaxshilik har doim qaytadi.</span>
          </p>
        </div>
      </section>
    </main>
  );
}
