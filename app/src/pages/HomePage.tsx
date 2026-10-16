import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { PromoCarousel } from '../components/home/PromoCarousel';
import { MarketTabsTable } from '../components/home/MarketTabsTable';
import {
  CommunitySection,
  DownloadBand,
  EarnLoansSection,
  EtfSection,
  HotSectorsSection,
  PlatformStatsSection,
  TopTraderSection,
} from '../components/home/HomeSections';

export default function HomePage(): React.ReactElement {
  return (
    <div className="bg-white pb-0">
      <HeroSection />
      <PromoCarousel />
      <MarketTabsTable />
      <TopTraderSection />
      <HotSectorsSection />
      <EtfSection />
      <EarnLoansSection />
      <PlatformStatsSection />
      <DownloadBand />
      <CommunitySection />
    </div>
  );
}
