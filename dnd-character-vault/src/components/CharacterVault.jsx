"use client";

import { useEffect, useRef, useState } from "react";
import { Backpack, BookOpen, Download, Dices, FileClock, Gamepad2, Plus, ScrollText, Shield, Sparkles, Swords, Upload, UserRound } from "lucide-react";
import { useCharacterVault } from "@/hooks/useCharacterVault";
import usePwaInstall from "@/hooks/usePwaInstall";
import useLocale from "@/hooks/useLocale";
import AppHeader from "@/components/sheet/AppHeader";
import IdentityPanel from "@/components/sheet/IdentityPanel";
import AbilityPanel from "@/components/sheet/AbilityPanel";
import SkillsPanel from "@/components/sheet/SkillsPanel";
import CombatPanel from "@/components/sheet/CombatPanel";
import AttacksPanel from "@/components/sheet/AttacksPanel";
import ResourcesPanel from "@/components/sheet/ResourcesPanel";
import InventoryPanel from "@/components/sheet/InventoryPanel";
import SpellsPanel from "@/components/sheet/SpellsPanel";
import NotesPanel from "@/components/sheet/NotesPanel";
import { DiceDrawer } from "@/components/dice/DicePanel";
import HistoryPanel from "@/components/history/HistoryPanel";
import MobileQuickNav from "@/components/sheet/MobileQuickNav";
import PwaInstallHint from "@/components/PwaInstallHint";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SegmentedToggle from "@/components/form/SegmentedToggle";
import PlayDashboard from "@/components/game/PlayDashboard";

const PLAY_SECTIONS = [
  { id: "play", label: "Play", icon: Gamepad2 },
  { id: "inventory", label: "Gear", icon: Backpack },
  { id: "spells", label: "Spells", icon: BookOpen },
  { id: "notes", label: "Notes", icon: Shield }
];

const EDIT_SECTIONS = [
  { id: "identity", label: "Hero", icon: UserRound },
  { id: "abilities", label: "Stats", icon: Sparkles },
  { id: "skills", label: "Skills", icon: ScrollText },
  { id: "combat", label: "Combat", icon: Swords },
  { id: "inventory", label: "Gear", icon: Backpack },
  { id: "spells", label: "Spells", icon: BookOpen },
  { id: "notes", label: "Notes", icon: Shield }
];

export default function CharacterVault() {
  const vault = useCharacterVault();
  const pwa = usePwaInstall();
  const { locale, setLocale, t } = useLocale();
  const fileRef = useRef(null);
  const [mode, setMode] = useState("play");
  const [diceOpen, setDiceOpen] = useState(false);
  const [dicePreset, setDicePreset] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const visibleSections = mode === "play" ? PLAY_SECTIONS : EDIT_SECTIONS;
  const [activeSection, setActiveSection] = useState(visibleSections[0].id);
  const localizedSections = visibleSections.map((section) => ({
    ...section,
    label: t(`nav.section.${section.id}`)
  }));
  const editPanelProps = { collapsible: true, defaultOpen: false };
  const openDice = (preset = {}) => {
    setDicePreset({ ...preset, id: Date.now(), autoRoll: preset.autoRoll ?? true });
    setDiceOpen(true);
  };

  useEffect(() => {
    if (!vault.notice && !vault.noticeKey) return undefined;
    const timer = window.setTimeout(() => {
      vault.setNotice("");
      vault.setNoticeKey("");
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [vault]);

  useEffect(() => {
    setActiveSection(mode === "play" ? PLAY_SECTIONS[0].id : EDIT_SECTIONS[0].id);
  }, [mode]);

  useEffect(() => {
    const sections = mode === "play" ? PLAY_SECTIONS : EDIT_SECTIONS;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0.05, 0.2, 0.45] }
    );

    for (const section of sections) {
      const node = document.getElementById(section.id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [mode]);

  return (
    <main className="min-h-screen max-w-full overflow-x-hidden px-3 pb-28 pt-3 text-ink sm:px-5 sm:py-5 lg:px-7 lg:pb-6">
      <ServiceWorkerRegister />
      <div className="mx-auto max-w-[1540px] min-w-0">
        <AppHeader
          character={vault.character}
          status={t(`generic.status.${vault.statusKey || "saved"}`)}
          locale={locale}
          setLocale={setLocale}
          t={t}
          actions={[
            { label: t("header.actions.snapshot"), icon: FileClock, onClick: vault.manualSnapshot },
            { label: t("header.actions.export"), icon: Download, onClick: vault.exportFile },
            { label: t("header.actions.import"), icon: Upload, onClick: () => fileRef.current?.click() },
            { label: t("header.actions.new"), icon: Plus, onClick: () => confirm(t("generic.confirm.newCharacter")) && vault.newCharacter() }
          ]}
        />

        <div className="mb-4 grid min-w-0 gap-3 rounded-md border border-umber/25 bg-vellum/55 p-3 shadow-insetLine sm:grid-cols-[minmax(220px,360px)_auto] sm:items-center sm:justify-between">
          <SegmentedToggle
            label=""
            value={mode}
            options={[
              { value: "play", label: t("mode.play") },
              { value: "edit", label: t("mode.edit") }
            ]}
            onChange={setMode}
          />
          <button
            type="button"
            onClick={() => openDice({ label: t("dice.title"), sides: 20, count: 1, autoRoll: false })}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink bg-oxblood px-4 font-ui text-sm font-black uppercase tracking-[0.08em] text-vellum shadow-insetLine transition hover:bg-oxblood/90"
          >
            <Dices className="h-4 w-4" aria-hidden="true" />
            {t("dice.title")}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) vault.importFile(file);
            event.target.value = "";
          }}
        />

        <div className="grid min-w-0 gap-4">
          <section className="paper-grain min-w-0 overflow-hidden rounded-md border border-umber/35 p-3 shadow-sheet sm:p-4 lg:p-5">
            {mode === "play" ? (
              <div className="grid min-w-0 gap-4">
                <PlayDashboard
                  character={vault.character}
                  t={t}
                  openDice={openDice}
                  actions={{
                    applyHitPointChange: vault.changeHitPoints,
                    adjustResource: vault.changeResource,
                    resetResources: vault.restResources,
                    setDeathSave: vault.changeDeathSave,
                    toggleCondition: vault.changeCondition,
                    addExperience: (amount) => vault.updateCharacter((current) => {
                      const next = structuredClone(current);
                      const experience = next.identity.experience || {};
                      next.identity.experience = {
                        ...experience,
                        current: Math.max(0, (Number(experience.current) || 0) + amount)
                      };
                      return next;
                    })
                  }}
                />
                <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
                  <section id="inventory" className="min-w-0 scroll-mt-4">
                    <InventoryPanel character={vault.character} updatePath={vault.updatePath} t={t} panelProps={{ ...editPanelProps, defaultOpen: true }} equipmentActions={{ toggleEquipped: vault.changeEquipment, useItem: vault.useEquipment }} openDice={openDice} />
                  </section>
                  <section id="spells" className="min-w-0 scroll-mt-4">
                    <SpellsPanel character={vault.character} updatePath={vault.updatePath} addItem={vault.addItem} removeItem={vault.removeItem} t={t} panelProps={editPanelProps} />
                  </section>
                </div>
                <section id="notes" className="min-w-0 scroll-mt-4">
                  <NotesPanel character={vault.character} updatePath={vault.updatePath} t={t} panelProps={editPanelProps} />
                </section>
              </div>
            ) : (
              <div className="grid min-w-0 gap-4">
                <section id="identity" className="min-w-0 scroll-mt-4">
                  <IdentityPanel character={vault.character} updatePath={vault.updatePath} t={t} panelProps={{ ...editPanelProps, defaultOpen: true }} />
                </section>
                <div className="grid min-w-0 gap-4 2xl:grid-cols-[320px_minmax(0,1fr)_380px]">
                  <section id="abilities" className="min-w-0 scroll-mt-4">
                    <AbilityPanel character={vault.character} updatePath={vault.updatePath} t={t} panelProps={editPanelProps} />
                  </section>
                  <section id="skills" className="min-w-0 scroll-mt-4">
                    <SkillsPanel character={vault.character} updatePath={vault.updatePath} t={t} panelProps={editPanelProps} />
                  </section>
                  <section id="combat" className="min-w-0 scroll-mt-4">
                    <CombatPanel character={vault.character} updatePath={vault.updatePath} t={t} panelProps={{ ...editPanelProps, defaultOpen: true }} />
                  </section>
                </div>
                <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
                  <AttacksPanel character={vault.character} updatePath={vault.updatePath} addItem={vault.addItem} removeItem={vault.removeItem} t={t} panelProps={editPanelProps} />
                  <ResourcesPanel character={vault.character} updatePath={vault.updatePath} addItem={vault.addItem} removeItem={vault.removeItem} t={t} panelProps={editPanelProps} />
                </div>
                <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
                  <section id="inventory" className="min-w-0 scroll-mt-4">
                    <InventoryPanel character={vault.character} updatePath={vault.updatePath} t={t} panelProps={editPanelProps} equipmentActions={{ toggleEquipped: vault.changeEquipment, useItem: vault.useEquipment }} openDice={openDice} />
                  </section>
                  <section id="spells" className="min-w-0 scroll-mt-4">
                    <SpellsPanel character={vault.character} updatePath={vault.updatePath} addItem={vault.addItem} removeItem={vault.removeItem} t={t} panelProps={editPanelProps} />
                  </section>
                </div>
                <section id="notes" className="min-w-0 scroll-mt-4">
                  <NotesPanel character={vault.character} updatePath={vault.updatePath} t={t} panelProps={editPanelProps} />
                </section>
              </div>
            )}
          </section>

        </div>
        <footer className="mt-4 flex flex-col gap-2 rounded-md border border-umber/25 bg-vellum/55 px-4 py-3 text-sm text-umber shadow-insetLine sm:flex-row sm:items-center sm:justify-between">
          <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em]">
            {t("footer.product")}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a className="font-bold underline-offset-4 hover:text-oxblood hover:underline" href="https://github.com/yudin-s/dnd-character-vault/blob/main/LICENSE" target="_blank" rel="noreferrer">
              {t("footer.license")}
            </a>
            <a className="font-bold underline-offset-4 hover:text-oxblood hover:underline" href="https://github.com/yudin-s/dnd-character-vault" target="_blank" rel="noreferrer">
              {t("footer.source")}
            </a>
            <a className="font-bold underline-offset-4 hover:text-oxblood hover:underline" href="https://github.com/yudin-s" target="_blank" rel="noreferrer">
              {t("footer.author")}
            </a>
          </div>
        </footer>
      </div>

      <button
        type="button"
        onClick={() => setHistoryOpen(true)}
        className="fixed bottom-40 right-3 z-50 grid h-14 w-14 place-items-center rounded-full border border-ink bg-parchment text-ink shadow-[0_12px_30px_rgba(37,24,19,0.26)] transition hover:bg-vellum lg:bottom-24 lg:right-6"
        aria-label={t("history.open")}
      >
        <FileClock className="h-6 w-6" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => openDice({ label: t("dice.title"), sides: 20, count: 1, autoRoll: false })}
        className="fixed bottom-24 right-3 z-50 grid h-14 w-14 place-items-center rounded-full border border-ink bg-oxblood text-vellum shadow-[0_12px_30px_rgba(37,24,19,0.32)] transition hover:bg-oxblood/90 lg:bottom-6 lg:right-6"
        aria-label={t("dice.title")}
      >
        <Dices className="h-6 w-6" aria-hidden="true" />
      </button>

      <div
        className={`fixed bottom-28 right-3 z-50 max-w-sm rounded-md border border-umber/40 bg-vellum px-4 py-3 text-sm shadow-sheet transition lg:bottom-4 lg:right-4 ${vault.notice || vault.noticeKey ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
        role="status"
        aria-live="polite"
      >
        {vault.noticeKey ? t(vault.noticeKey) : vault.notice}
      </div>
      <PwaInstallHint canInstall={pwa.canInstall} isStandalone={pwa.isStandalone} onInstall={pwa.promptInstall} t={t} />
      <MobileQuickNav
        sections={localizedSections}
        activeSection={activeSection}
        onSectionClick={(id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
        label={t("header.quickSectionsLabel")}
      />
      {historyOpen ? (
        <div className="fixed inset-0 z-[70] bg-ink/50 backdrop-blur-[2px]" role="presentation" onMouseDown={() => setHistoryOpen(false)}>
          <div className="fixed inset-y-0 right-0 flex w-full max-w-[390px] p-3 sm:p-4" onMouseDown={(event) => event.stopPropagation()}>
            <HistoryPanel
              history={vault.history}
              status={t(`generic.status.${vault.statusKey || "saved"}`)}
              restoreSnapshot={(id) => {
                vault.restoreSnapshot(id);
                setHistoryOpen(false);
              }}
              clearLocal={() => confirm(t("generic.confirm.clearLocal")) && vault.clearLocal()}
              t={t}
              onClose={() => setHistoryOpen(false)}
              className="h-full w-full"
            />
          </div>
        </div>
      ) : null}
      <DiceDrawer t={t} isOpen={diceOpen} onClose={() => setDiceOpen(false)} preset={dicePreset} />
    </main>
  );
}
