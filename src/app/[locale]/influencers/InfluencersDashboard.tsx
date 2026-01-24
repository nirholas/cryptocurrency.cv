'use client';

import InfluencerLeaderboard from '@/components/InfluencerLeaderboard';

export function InfluencersDashboard() {
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

export default InfluencersDashboard;
