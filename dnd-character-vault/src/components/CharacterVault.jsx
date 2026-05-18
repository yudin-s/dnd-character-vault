"use client";

import { useEffect, useRef, useState } from "react";
import { Backpack, BookOpen, Download, Dices, FileClock, Plus, ScrollText, Shield, Sparkles, Swords, Upload, UserRound } from "lucide-react";
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
import DicePanel from "@/components/dice/DicePanel";
import HistoryPanel from "@/components/history/HistoryPanel";
import MobileQuickNav from "@/components/sheet/MobileQuickNav";
import PwaInstallHint from "@/components/PwaInstallHint";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const MOBILE_SECTIONS = [
  { id: "identity", label: "Hero", icon: UserRound },
  { id: "abilities", label: "Stats", icon: Sparkles },
  { id: "skills", label: "Skills", icon: ScrollText },
  { id: "combat", label: "Combat", icon: Swords },
  { id: "dices", label: "Dices", icon: Dices },
  { id: "inventory", label: "Gear", icon: Backpack },
  { id: "spells", label: "Spells", icon: BookOpen },
  { id: "notes", label: "Notes", icon: Shield }
];

export default function CharacterVault() {
  const vault = useCharacterVault();
  const pwa = usePwaInstall();
  const { locale, setLocale, t } = useLocale();
  const fileRef = useRef(null);
  const [activeSection, setActiveSection] = useState(MOBILE_SECTIONS[0].id);
  const localizedSections = MOBILE_SECTIONS.map((section) => ({
    ...section,
    label: t(`nav.section.${section.id}`)
  }));

  useEffect(() => {
    if (!vault.notice && !vault.noticeKey) return undefined;
    const timer = window.setTimeout(() => {
      vault.setNotice("");
      vault.setNoticeKey("");
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [vault]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0.05, 0.2, 0.45] }
    );

    for (const section of MOBILE_SECTIONS) {
      const node = document.getElementById(section.id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen max-w-full overflow-x-hidden px-3 pb-28 pt-3 text-ink sm:px-5 sm:py-5 lg:px-7 lg:pb-6">
      <ServiceWorkerRegister />
      <div className="mx-auto max-w-[1540px] min-w-0">
        <AppHeader
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

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="paper-grain min-w-0 overflow-hidden rounded-md border border-umber/35 p-3 shadow-sheet sm:p-4 lg:p-5">
            <div className="grid min-w-0 gap-4">
              <section id="identity" className="min-w-0 scroll-mt-4">
                <IdentityPanel character={vault.character} updatePath={vault.updatePath} t={t} />
              </section>
              <div className="grid min-w-0 gap-4 2xl:grid-cols-[320px_minmax(0,1fr)_380px]">
                <section id="abilities" className="min-w-0 scroll-mt-4">
                  <AbilityPanel character={vault.character} updatePath={vault.updatePath} t={t} />
                </section>
                <section id="skills" className="min-w-0 scroll-mt-4">
                  <SkillsPanel character={vault.character} updatePath={vault.updatePath} t={t} />
                </section>
                <section id="combat" className="min-w-0 scroll-mt-4">
                  <CombatPanel character={vault.character} updatePath={vault.updatePath} t={t} />
                </section>
              </div>
              <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
                <AttacksPanel character={vault.character} updatePath={vault.updatePath} addItem={vault.addItem} removeItem={vault.removeItem} t={t} />
                <ResourcesPanel character={vault.character} updatePath={vault.updatePath} addItem={vault.addItem} removeItem={vault.removeItem} t={t} />
              </div>
              <section id="dices" className="min-w-0 scroll-mt-4">
                <DicePanel t={t} />
              </section>
              <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
                <section id="inventory" className="min-w-0 scroll-mt-4">
                  <InventoryPanel character={vault.character} updatePath={vault.updatePath} t={t} />
                </section>
                <section id="spells" className="min-w-0 scroll-mt-4">
                  <SpellsPanel character={vault.character} updatePath={vault.updatePath} addItem={vault.addItem} removeItem={vault.removeItem} t={t} />
                </section>
              </div>
              <section id="notes" className="min-w-0 scroll-mt-4">
                <NotesPanel character={vault.character} updatePath={vault.updatePath} t={t} />
              </section>
            </div>
          </section>

          <HistoryPanel
            history={vault.history}
            status={t(`generic.status.${vault.statusKey || "saved"}`)}
            restoreSnapshot={vault.restoreSnapshot}
            clearLocal={() => confirm(t("generic.confirm.clearLocal")) && vault.clearLocal()}
            t={t}
          />
        </div>
      </div>

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
    </main>
  );
}
