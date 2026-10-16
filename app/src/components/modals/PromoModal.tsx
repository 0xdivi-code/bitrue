import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { GoldButton } from '../ui/primitives';
import { PromoArt } from '../market/PromoArt';
import type { PromoCard } from '../../types/domain';

export function PromoModal({ open, promo, onClose }: { open: boolean; promo: PromoCard; onClose: () => void }): React.ReactElement {
  const navigate = useNavigate();
  return (
    <Modal open={open} onClose={onClose} width={460}>
      <div className="pt-6">
        <div className="overflow-hidden rounded-xl">
          <PromoArt art={promo.art} from={promo.accentFrom} to={promo.accentTo} height={140} />
        </div>
        <span className="mt-4 inline-block rounded bg-black/[.05] px-2 py-0.5 text-[11px] font-medium text-txt-darksec">
          {promo.tag}
        </span>
        <h3 className="mt-2 text-[17px] font-bold leading-snug text-txt-dark">{promo.title}</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-txt-darksec">
          This promotion card is part of the frontend demo. Participating would normally require an account; here the
          campaign details, rewards and eligibility are illustrative only.
        </p>
        <div className="mt-5 flex gap-2">
          <GoldButton
            className="flex-1"
            onClick={() => {
              onClose();
              navigate('/placeholder/rewards-center');
            }}
          >
            View Campaign Page
          </GoldButton>
        </div>
      </div>
    </Modal>
  );
}
