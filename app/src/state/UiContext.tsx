/** Global UI state: modal routing + toast notifications. */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ModalKind =
  | 'auth' // login / signup combined modal
  | 'forgot'
  | 'download'
  | 'language'
  | 'promo'
  | 'pair-selector'
  | 'confirm';

export interface ModalRequest {
  kind: ModalKind;
  props?: Record<string, unknown>;
}

export interface Toast {
  id: number;
  tone: 'success' | 'info' | 'error';
  title: string;
  body?: string;
}

interface UiContextValue {
  modal: ModalRequest | null;
  openModal: (kind: ModalKind, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  supportOpen: boolean;
  setSupportOpen: (v: boolean) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

let toastSeq = 1;

export function UiProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [modal, setModal] = useState<ModalRequest | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);

  const openModal = useCallback((kind: ModalKind, props?: Record<string, unknown>) => {
    setModal({ kind, props });
  }, []);
  const closeModal = useCallback(() => setModal(null), []);

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = toastSeq++;
    setToasts((list) => [...list.slice(-3), { ...t, id }]);
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 5200);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((list) => list.filter((x) => x.id !== id)), []);

  const value = useMemo(
    () => ({ modal, openModal, closeModal, toasts, pushToast, dismissToast, supportOpen, setSupportOpen }),
    [modal, openModal, closeModal, toasts, pushToast, dismissToast, supportOpen],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi outside provider');
  return ctx;
}
