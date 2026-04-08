import { create } from "zustand";

interface ConfirmState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

interface ConfirmStore extends ConfirmState {
  openConfirm: (config: {
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  closeConfirm: () => void;
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  isOpen: false,
  title: "",
  description: "",
  onConfirm: null,
  onCancel: null,
  openConfirm: (config) =>
    set({
      isOpen: true,
      title: config.title,
      description: config.description,
      onConfirm: config.onConfirm,
      onCancel: config.onCancel || null,
    }),
  closeConfirm: () =>
    set({
      isOpen: false,
      title: "",
      description: "",
      onConfirm: null,
      onCancel: null,
    }),
}));

export function useConfirmDestructive() {
  const { openConfirm, closeConfirm } = useConfirmStore();

  const confirm = (config: {
    title: string;
    description: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      openConfirm({
        title: config.title,
        description: config.description,
        onConfirm: () => {
          closeConfirm();
          resolve(true);
        },
        onCancel: () => {
          closeConfirm();
          resolve(false);
        },
      });
    });
  };

  return { confirm };
}
