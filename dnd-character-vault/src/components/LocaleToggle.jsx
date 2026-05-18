"use client";

export default function LocaleToggle({ locale, setLocale }) {
  return (
    <div className="inline-flex h-10 overflow-hidden rounded-md border border-ink/80 bg-parchment shadow-insetLine" aria-label="Language">
      {["en", "ru"].map((item) => {
        const active = locale === item;
        return (
          <button
            key={item}
            type="button"
            onClick={() => setLocale(item)}
            className={`min-w-10 px-2 font-ui text-xs font-black uppercase transition ${active ? "bg-ink text-vellum" : "text-ink hover:bg-vellum"}`}
            aria-pressed={active}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
