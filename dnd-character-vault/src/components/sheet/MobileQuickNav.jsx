export default function MobileQuickNav({
  sections = [],
  activeSection,
  onSectionClick,
  label = "Quick sections",
}) {
  if (!Array.isArray(sections) || sections.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 max-w-full overflow-hidden border-t border-umber/35 bg-vellum/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-lg backdrop-blur lg:hidden"
      aria-label={label}
    >
      <ul className="scrollbar-thin flex w-full min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain whitespace-nowrap pb-2">
        {sections.map((section) => {
          if (!section) return null;
          const isActive = section.id === activeSection;
          const Icon = section.icon;

          return (
            <li key={section.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSectionClick?.(section.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={section.label}
                className={`inline-flex min-w-16 flex-col items-center justify-center gap-1 rounded-md border px-3 py-2 text-[11px] font-ui font-medium transition ${
                  isActive
                    ? "border-oxblood bg-oxblood/10 text-oxblood"
                    : "border-stone-300/70 bg-white/60 text-stone-700"
                }`}
              >
                {Icon ? (
                  <>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="max-w-20 truncate">{section.label}</span>
                  </>
                ) : (
                  <span className="max-w-28 truncate px-1 text-center text-[11px] font-semibold">
                    {section.label}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
