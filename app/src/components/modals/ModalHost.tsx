import React from 'react';
import { useUi } from '../../state/UiContext';
import { AuthModal } from './AuthModal';
import { DownloadModal } from './DownloadModal';
import { PromoModal } from './PromoModal';
import { ConfirmModal } from './ConfirmModal';
import type { PromoCard } from '../../types/domain';

/** Single mount-point that renders whichever global modal is requested. */
export function ModalHost(): React.ReactElement {
  const { modal, closeModal } = useUi();

  if (!modal) return <></>;

  switch (modal.kind) {
    case 'auth':
      return (
        <AuthModal
          open
          initialMode={(modal.props?.mode as 'login' | 'signup' | undefined) ?? 'login'}
          onClose={closeModal}
          onDone={modal.props?.onDone as (() => void) | undefined}
        />
      );
    case 'forgot':
      return <AuthModal open initialMode="forgot" onClose={closeModal} />;
    case 'download':
      return <DownloadModal open onClose={closeModal} />;
    case 'language':
      return <></>;
    case 'promo': {
      const promo = modal.props?.promo as PromoCard | undefined;
      if (!promo) return <></>;
      return <PromoModal open promo={promo} onClose={closeModal} />;
    }
    case 'confirm': {
      const title = (modal.props?.title as string) ?? 'Are you sure?';
      const body = (modal.props?.body as string) ?? '';
      const action = modal.props?.action as (() => void) | undefined;
      return (
        <ConfirmModal
          open
          title={title}
          body={body}
          onClose={closeModal}
          onConfirm={() => {
            closeModal();
            window.setTimeout(() => action?.(), 0);
          }}
        />
      );
    }
    default:
      return <></>;
  }
}
