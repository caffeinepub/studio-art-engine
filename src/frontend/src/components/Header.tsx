import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { Project } from '../App';
import SaveStatusIndicator from './SaveStatusIndicator';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'workshop' | 'rarity' | 'rules' | 'preview' | 'builder' | 'vault' | 'settings') => void;
  currentProject?: Project;
  onBackToDashboard: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'failed';
}

export default function Header({ currentView, onNavigate, currentProject, onBackToDashboard, saveStatus = 'idle' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'workshop', label: 'Workshop' },
    { id: 'rarity', label: 'Rarity' },
    { id: 'rules', label: 'Rules' },
    { id: 'preview', label: 'Preview' },
    { id: 'builder', label: 'Forge' },
    { id: 'vault', label: 'Vault' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="flex-shrink-0 bg-card border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1 lg:flex-initial">
            {currentProject ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToDashboard}
                className="text-foreground hover:text-foreground hover:bg-muted font-semibold px-3 h-9 text-sm"
              >
                ← Projects
              </Button>
            ) : (
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
                  Studio Art Engine
                </h1>
              </div>
            )}
          </div>

          {currentProject && (
            <>
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate(item.id as any)}
                      className={`text-sm font-medium px-3 h-9 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </nav>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-foreground hover:bg-muted h-9 w-9"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </>
          )}

          {currentProject && (
            <div className="hidden lg:flex items-center gap-3 text-right">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{currentProject.name}</div>
                <div className="text-xs text-muted-foreground font-medium">
                  {currentProject.blockchain}
                </div>
              </div>
              <SaveStatusIndicator status={saveStatus} />
            </div>
          )}
        </div>

        {currentProject && mobileMenuOpen && (
          <nav className="lg:hidden mt-3 pt-3 border-t border-border flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onNavigate(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-sm font-medium px-3 h-10 justify-start rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Button>
              );
            })}
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{currentProject.name}</div>
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
