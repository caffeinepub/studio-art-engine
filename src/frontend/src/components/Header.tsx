import { MenuIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Project } from "../App";
import SaveStatusIndicator from "./SaveStatusIndicator";

interface HeaderProps {
  currentView: string;
  onNavigate: (
    view:
      | "dashboard"
      | "workshop"
      | "rarity"
      | "rules"
      | "preview"
      | "builder"
      | "vault"
      | "settings",
  ) => void;
  currentProject?: Project;
  onBackToDashboard: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "failed";
}

export default function Header({
  currentView,
  onNavigate,
  currentProject,
  onBackToDashboard,
  saveStatus = "idle",
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "workshop", label: "Workshop" },
    { id: "rarity", label: "Rarity" },
    { id: "rules", label: "Rules" },
    { id: "preview", label: "Preview" },
    { id: "builder", label: "Forge" },
    { id: "vault", label: "Vault" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <header className="flex-shrink-0 bg-card border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
            {currentProject ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToDashboard}
                className="motion-button motion-press-snappy text-foreground hover:text-foreground hover:bg-muted font-semibold px-3 h-9 text-sm"
              >
                ← Projects
              </Button>
            ) : (
              <div />
            )}
          </div>

          {currentProject && (
            <>
              <nav className="hidden lg:flex items-center gap-1 flex-1">
                {navItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onNavigate(
                          item.id as
                            | "dashboard"
                            | "workshop"
                            | "rarity"
                            | "rules"
                            | "preview"
                            | "builder"
                            | "vault"
                            | "settings",
                        )
                      }
                      className={`motion-button motion-press-snappy relative text-sm font-medium px-3 h-9 rounded-lg overflow-hidden ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.label}
                      {!isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-foreground/30 rounded-full transition-all duration-hover ease-apple group-hover:w-4/5 opacity-0 hover:opacity-100" />
                      )}
                    </Button>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden motion-icon-button text-foreground hover:bg-muted h-9 w-9 rounded inline-flex items-center justify-center"
              >
                {mobileMenuOpen ? (
                  <XIcon className="w-5 h-5" />
                ) : (
                  <MenuIcon className="w-5 h-5" />
                )}
              </button>
            </>
          )}

          {currentProject && (
            <div className="hidden lg:flex items-center gap-3 text-right flex-shrink-0">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {currentProject.name}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {currentProject.blockchain}
                </div>
              </div>
              <SaveStatusIndicator status={saveStatus} />
            </div>
          )}
        </div>

        {currentProject && mobileMenuOpen && (
          <nav className="lg:hidden mt-3 pt-3 border-t border-border flex flex-col gap-1 animate-slide-in">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onNavigate(
                      item.id as
                        | "dashboard"
                        | "workshop"
                        | "rarity"
                        | "rules"
                        | "preview"
                        | "builder"
                        | "vault"
                        | "settings",
                    );
                    setMobileMenuOpen(false);
                  }}
                  className={`motion-button motion-press-snappy text-sm font-medium px-3 h-10 justify-start rounded-lg ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Button>
              );
            })}
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {currentProject.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">
                    {currentProject.blockchain}
                  </div>
                </div>
                <SaveStatusIndicator status={saveStatus} />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
