import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Project, Rule } from "../App";

interface RulesProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

export default function Rules({ project, onUpdateProject }: RulesProps) {
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleType, setRuleType] = useState<"exclude" | "force">("exclude");
  const [primaryTrait, setPrimaryTrait] = useState<{
    layerId: string;
    traitId: string;
  } | null>(null);
  const [selectedIncompatibleTraits, setSelectedIncompatibleTraits] = useState<
    Set<string>
  >(new Set());

  const validLayers = useMemo(
    () => project.layers.filter((l) => l.traits.length > 0),
    [project.layers],
  );

  const resetForm = () => {
    setRuleType("exclude");
    setPrimaryTrait(null);
    setSelectedIncompatibleTraits(new Set());
    setIsEditMode(false);
    setEditingRuleId(null);
  };

  const openAddRuleModal = () => {
    resetForm();
    setIsAddRuleOpen(true);
  };

  const openEditRuleModal = (rule: Rule) => {
    setIsEditMode(true);
    setEditingRuleId(rule.id);
    setRuleType(rule.type);
    setPrimaryTrait({
      layerId: rule.primaryTrait.layerId,
      traitId: rule.primaryTrait.traitId,
    });

    const incompatibleSet = new Set<string>();
    for (const trait of rule.incompatibleTraits) {
      incompatibleSet.add(`${trait.layerId}:${trait.traitId}`);
    }
    setSelectedIncompatibleTraits(incompatibleSet);
    setIsAddRuleOpen(true);
  };

  const duplicateRule = (rule: Rule) => {
    const newRule: Rule = {
      id: Date.now().toString(),
      type: rule.type,
      primaryTrait: { ...rule.primaryTrait },
      incompatibleTraits: rule.incompatibleTraits.map((t) => ({ ...t })),
    };

    onUpdateProject((p) => ({
      ...p,
      rules: [...p.rules, newRule],
    }));
    toast.success("RULE DUPLICATED");
  };

  const addOrUpdateRule = () => {
    if (!primaryTrait || selectedIncompatibleTraits.size === 0) {
      toast.error("SELECT PRIMARY AND INCOMPATIBLE TRAITS");
      return;
    }

    const incompatibleTraits = Array.from(selectedIncompatibleTraits).map(
      (key) => {
        const [layerId, traitId] = key.split(":");
        return { layerId, traitId };
      },
    );

    const hasSelfReference = incompatibleTraits.some(
      (trait) =>
        trait.layerId === primaryTrait.layerId &&
        trait.traitId === primaryTrait.traitId,
    );

    if (hasSelfReference) {
      toast.error("CANNOT USE SAME TRAIT");
      return;
    }

    if (isEditMode && editingRuleId) {
      onUpdateProject((p) => ({
        ...p,
        rules: p.rules.map((r) =>
          r.id === editingRuleId
            ? {
                ...r,
                type: ruleType,
                primaryTrait: {
                  layerId: primaryTrait.layerId,
                  traitId: primaryTrait.traitId,
                },
                incompatibleTraits,
              }
            : r,
        ),
      }));
      toast.success("RULE UPDATED");
    } else {
      const newRule: Rule = {
        id: Date.now().toString(),
        type: ruleType,
        primaryTrait: {
          layerId: primaryTrait.layerId,
          traitId: primaryTrait.traitId,
        },
        incompatibleTraits,
      };

      onUpdateProject((p) => ({
        ...p,
        rules: [...p.rules, newRule],
      }));
      toast.success("RULE ADDED");
    }

    setIsAddRuleOpen(false);
    resetForm();
  };

  const deleteRule = (ruleId: string) => {
    onUpdateProject((p) => ({
      ...p,
      rules: p.rules.filter((r) => r.id !== ruleId),
    }));
    toast.success("RULE DELETED");
  };

  const getTraitInfo = (
    layerId: string,
    traitId: string,
  ): { name: string; imageData: string; layerName: string } | null => {
    const layer = project.layers.find((l) => l.id === layerId);
    if (!layer) return null;
    const trait = layer.traits.find((t) => t.id === traitId);
    if (!trait) return null;
    return {
      name: trait.name,
      imageData: trait.imageData,
      layerName: layer.name,
    };
  };

  const togglePrimaryTrait = (layerId: string, traitId: string) => {
    if (
      primaryTrait?.layerId === layerId &&
      primaryTrait?.traitId === traitId
    ) {
      setPrimaryTrait(null);
    } else {
      setPrimaryTrait({ layerId, traitId });
    }
  };

  const toggleIncompatibleTrait = (key: string) => {
    const newSet = new Set(selectedIncompatibleTraits);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedIncompatibleTraits(newSet);
  };

  const isTraitDimmed = (layerId: string) => {
    return primaryTrait && layerId === primaryTrait.layerId;
  };

  const getPrimaryTraitDisplay = () => {
    if (!primaryTrait) return "SELECT A TRAIT";
    const info = getTraitInfo(primaryTrait.layerId, primaryTrait.traitId);
    return info ? info.name.toUpperCase() : "UNKNOWN";
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">
                    MATCHING RULES
                  </h1>
                  <span className="text-2xl">🚫</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Make sure items look good together. E.g. don't wear a hat with
                  a helmet!
                </p>
              </div>
              <Button
                onClick={openAddRuleModal}
                disabled={validLayers.length < 2}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tight px-6 h-12 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all"
              >
                + NEW RULE
              </Button>
            </div>

            {/* Rules List */}
            {validLayers.length < 2 ? (
              <div className="bg-card/50 border border-border rounded-lg p-16 text-center">
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-tight">
                  NEED AT LEAST 2 LAYERS WITH TRAITS TO CREATE RULES
                </p>
              </div>
            ) : project.rules.length === 0 ? (
              <div className="bg-card/50 border border-border rounded-lg p-16 text-center">
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-tight">
                  NO RULES YET. CLICK "+ NEW RULE" TO GET STARTED
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {project.rules.map((rule) => {
                  const primaryInfo = getTraitInfo(
                    rule.primaryTrait.layerId,
                    rule.primaryTrait.traitId,
                  );

                  return (
                    <div
                      key={rule.id}
                      className="bg-[#1a1a1a] border border-border/50 rounded-xl p-6 hover:border-border transition-all group"
                    >
                      <div className="flex items-center justify-between gap-6">
                        {/* Left: Category Label and Trait Name */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
                            {primaryInfo?.layerName || "UNKNOWN"}
                          </div>
                          <div className="text-2xl font-black text-foreground uppercase tracking-tight">
                            {primaryInfo?.name || "UNKNOWN TRAIT"}
                          </div>
                        </div>

                        {/* Right: Status Button and Trait Gallery */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          {/* Trait Image Gallery */}
                          <div className="flex items-center gap-2">
                            {rule.incompatibleTraits
                              .slice(0, 4)
                              .map((trait) => {
                                const traitInfo = getTraitInfo(
                                  trait.layerId,
                                  trait.traitId,
                                );
                                if (!traitInfo) return null;

                                return (
                                  <div
                                    key={`${trait.layerId}-${trait.traitId}`}
                                    className="w-12 h-12 bg-background border border-border rounded overflow-hidden"
                                  >
                                    <img
                                      src={traitInfo.imageData}
                                      alt={traitInfo.name}
                                      className="w-full h-full object-contain"
                                      style={{
                                        imageRendering: project.pixelArtMode
                                          ? "pixelated"
                                          : "auto",
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            {rule.incompatibleTraits.length > 4 && (
                              <div className="w-12 h-12 bg-background border border-border rounded flex items-center justify-center">
                                <span className="text-xs font-black text-muted-foreground">
                                  +{rule.incompatibleTraits.length - 4}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Status Button */}
                          <button
                            type="button"
                            className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-tight transition-all ${
                              rule.type === "exclude"
                                ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                                : "bg-teal-500/20 text-teal-400 border border-teal-500/50 hover:bg-teal-500/30"
                            }`}
                          >
                            {rule.type === "exclude"
                              ? "CAN'T WEAR"
                              : "MUST WEAR"}
                          </button>

                          {/* Edit/Duplicate/Delete Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => duplicateRule(rule)}
                              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded transition-colors"
                              title="Duplicate rule"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditRuleModal(rule)}
                              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded transition-colors"
                              title="Edit rule"
                            >
                              <span className="text-base font-black">✎</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRule(rule.id)}
                              className="w-8 h-8 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded transition-colors"
                              title="Delete rule"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Rule Modal */}
      <Dialog
        open={isAddRuleOpen}
        onOpenChange={(open) => {
          setIsAddRuleOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="bg-[#1a1a1a] border-2 border-border w-[900px] max-w-[90vw] h-[700px] max-h-[85vh] p-0 flex flex-col overflow-hidden">
          {/* Header with Rule Type Toggle and Close */}
          <div className="shrink-0 px-8 pt-6 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
                {isEditMode ? "EDIT RULE" : "SET A RULE"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRuleOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rule Type Toggle */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRuleType("exclude")}
                className={`flex-1 px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-tight transition-all ${
                  ruleType === "exclude"
                    ? "bg-destructive text-destructive-foreground shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                DON'T MATCH
              </button>
              <button
                type="button"
                onClick={() => setRuleType("force")}
                className={`flex-1 px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-tight transition-all ${
                  ruleType === "force"
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                MUST MATCH
              </button>
            </div>
          </div>

          {/* Two-Panel Layout with Fixed Height Scrollable Areas */}
          <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden min-h-0">
            {/* Left Panel - Primary Trait Selection */}
            <div className="border-r border-border/50 flex flex-col min-h-0">
              <div className="shrink-0 px-6 py-4 border-b border-border/50">
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-tight mb-1">
                  WHEN I PICK...
                </div>
                <div className="text-base font-black text-foreground uppercase tracking-tight">
                  {getPrimaryTraitDisplay()}
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-6 space-y-6">
                  {validLayers.map((layer) => (
                    <div key={layer.id}>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-tight mb-3">
                        {layer.name}
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {layer.traits.map((trait) => {
                          const isSelected =
                            primaryTrait?.layerId === layer.id &&
                            primaryTrait?.traitId === trait.id;

                          return (
                            <button
                              type="button"
                              key={trait.id}
                              onClick={() =>
                                togglePrimaryTrait(layer.id, trait.id)
                              }
                              className={`aspect-square bg-background border-2 overflow-hidden transition-all duration-200 ease-in-out group/trait ${
                                isSelected
                                  ? "border-primary shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                                  : "border-border hover:border-primary/50 hover:shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                              }`}
                            >
                              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                <img
                                  src={trait.imageData}
                                  alt={trait.name}
                                  className="w-full h-full object-contain transition-transform duration-200 ease-in-out group-hover/trait:scale-110"
                                  style={{
                                    imageRendering: project.pixelArtMode
                                      ? "pixelated"
                                      : "auto",
                                  }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Incompatible Traits Selection */}
            <div className="flex flex-col min-h-0">
              <div className="shrink-0 px-6 py-4 border-b border-border/50">
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-tight mb-1">
                  {ruleType === "exclude"
                    ? "I CAN'T WEAR..."
                    : "I MUST WEAR..."}
                </div>
                <div className="text-base font-black text-foreground uppercase tracking-tight">
                  {selectedIncompatibleTraits.size} STYLES
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-6 space-y-6">
                  {validLayers.map((layer) => {
                    const isDimmed = isTraitDimmed(layer.id);

                    return (
                      <div
                        key={layer.id}
                        className={isDimmed ? "opacity-40" : ""}
                      >
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-tight mb-3">
                          {layer.name}
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {layer.traits.map((trait) => {
                            const key = `${layer.id}:${trait.id}`;
                            const isSelected =
                              selectedIncompatibleTraits.has(key);

                            return (
                              <button
                                type="button"
                                key={trait.id}
                                onClick={() => toggleIncompatibleTrait(key)}
                                className={`aspect-square bg-background border-2 overflow-hidden transition-all duration-200 ease-in-out group/trait ${
                                  isSelected
                                    ? "border-primary shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                                    : "border-border hover:border-primary/50 hover:shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                                }`}
                              >
                                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                  <img
                                    src={trait.imageData}
                                    alt={trait.name}
                                    className="w-full h-full object-contain transition-transform duration-200 ease-in-out group-hover/trait:scale-110"
                                    style={{
                                      imageRendering: project.pixelArtMode
                                        ? "pixelated"
                                        : "auto",
                                    }}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Footer with Action Buttons */}
          <div className="shrink-0 px-8 py-5 border-t border-border/50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsAddRuleOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground font-bold uppercase tracking-tight transition-colors"
            >
              CANCEL
            </button>
            <Button
              onClick={addOrUpdateRule}
              disabled={!primaryTrait || selectedIncompatibleTraits.size === 0}
              className="bg-primary text-primary-foreground font-black uppercase tracking-tight px-8 py-2.5 shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all"
            >
              SAVE THIS RULE
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
