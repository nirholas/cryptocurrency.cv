'use client';

import InfluencerLeaderboard from '@/components/InfluencerLeaderboard';

/** Dashboard component for influencer reliability tracking */
export default function InfluencersDashboard() {
  return (
    <div className="space-y-8">
      <InfluencerLeaderboard 
        showStats={true}
        showRecentCalls={true}
        maxItems={20}
      />
    </div>
  );
}
