import React from 'react';
import { Modal } from '../ui/Modal';
import { GhostButton, GoldButton } from '../ui/primitives';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ open, title, body, confirmLabel = 'Confirm', onClose, onConfirm }: ConfirmModalProps): React.ReactElement {
  return (
    <Modal open={open} onClose={onClose} title={title} width={380}>
      <p className="pt-1 text-[13px] leading-relaxed text-txt-darksec">{body}</p>
      <div className="mt-5 flex gap-2">
        <GhostButton tone="light" className="flex-1" onClick={onClose}>
          Keep
        </GhostButton>
        <GoldButton className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </GoldButton>
      </div>
    </Modal>
  );
}
