import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";

actor {
  include MixinObjectStorage();

  public type RenderOrderRule = {
    timeLeft : Nat; // milliseconds before auto-removal
    layerName : Text;
    renderOrder : Nat;
  };

  public type GenesisCraftPreview = { // Kept for frontend compatibility
    craftName : Text;
    inputImageSrc : Text;
    overlayOffsetX : Int;
    overlayOffsetY : Int;
    overlayWidth : Nat;
    overlayHeight : Nat;
    creationTime : Int;
    staticPreviewTimeoutId : ?Nat;
    previewTimeoutId : ?Nat;
  };
};
