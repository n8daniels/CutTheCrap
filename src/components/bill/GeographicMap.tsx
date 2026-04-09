'use client';

export default function GeographicMap() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Geographic Connection Map</h3>
          <p className="text-gray-500 max-w-md">
            Coming soon — see which states and districts are connected to this bill
            through their representatives&apos; votes, sponsorships, and donor networks.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Will include US map with state-level vote overlay and global map for international connections via FARA data.
          </p>
        </div>
      </div>
    </div>
  );
}
