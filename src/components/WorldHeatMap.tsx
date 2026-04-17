'use client';

import { memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Map Vercel's 2-letter country codes to the numeric ISO codes used by the topojson
const COUNTRY_CODE_TO_ID: Record<string, string> = {
  AF:'004',AL:'008',DZ:'012',AD:'020',AO:'024',AG:'028',AR:'032',AM:'051',
  AU:'036',AT:'040',AZ:'031',BS:'044',BH:'048',BD:'050',BB:'052',BY:'112',
  BE:'056',BZ:'084',BJ:'204',BT:'064',BO:'068',BA:'070',BW:'072',BR:'076',
  BN:'096',BG:'100',BF:'854',BI:'108',KH:'116',CM:'120',CA:'124',CF:'140',
  TD:'148',CL:'152',CN:'156',CO:'170',KM:'174',CD:'180',CG:'178',CR:'188',
  CI:'384',HR:'191',CU:'192',CY:'196',CZ:'203',DK:'208',DJ:'262',DM:'212',
  DO:'214',EC:'218',EG:'818',SV:'222',GQ:'226',ER:'232',EE:'233',SZ:'748',
  ET:'231',FJ:'242',FI:'246',FR:'250',GA:'266',GM:'270',GE:'268',DE:'276',
  GH:'288',GR:'300',GD:'308',GT:'320',GN:'324',GW:'624',GY:'328',HT:'332',
  HN:'340',HU:'348',IS:'352',IN:'356',ID:'360',IR:'364',IQ:'368',IE:'372',
  IL:'376',IT:'380',JM:'388',JP:'392',JO:'400',KZ:'398',KE:'404',KI:'296',
  KP:'408',KR:'410',KW:'414',KG:'417',LA:'418',LV:'428',LB:'422',LS:'426',
  LR:'430',LY:'434',LI:'438',LT:'440',LU:'442',MG:'450',MW:'454',MY:'458',
  MV:'462',ML:'466',MT:'470',MR:'478',MU:'480',MX:'484',MD:'498',MC:'492',
  MN:'496',ME:'499',MA:'504',MZ:'508',MM:'104',NA:'516',NP:'524',NL:'528',
  NZ:'554',NI:'558',NE:'562',NG:'566',NO:'578',OM:'512',PK:'586',PA:'591',
  PG:'598',PY:'600',PE:'604',PH:'608',PL:'616',PT:'620',QA:'634',RO:'642',
  RU:'643',RW:'646',SA:'682',SN:'686',RS:'688',SL:'694',SG:'702',SK:'703',
  SI:'705',SB:'090',SO:'706',ZA:'710',SS:'728',ES:'724',LK:'144',SD:'729',
  SR:'740',SE:'752',CH:'756',SY:'760',TW:'158',TJ:'762',TZ:'834',TH:'764',
  TL:'626',TG:'768',TO:'776',TT:'780',TN:'788',TR:'792',TM:'795',UG:'800',
  UA:'804',AE:'784',GB:'826',US:'840',UY:'858',UZ:'860',VU:'548',VE:'862',
  VN:'704',YE:'887',ZM:'894',ZW:'716',
};

interface WorldHeatMapProps {
  countryData: Record<string, number>;
}

function WorldHeatMap({ countryData }: WorldHeatMapProps) {
  // Convert 2-letter codes to numeric IDs
  const countryById: Record<string, number> = {};
  for (const [code, count] of Object.entries(countryData)) {
    const id = COUNTRY_CODE_TO_ID[code];
    if (id) countryById[id] = count;
  }

  const maxVisits = Math.max(1, ...Object.values(countryById));

  function getColor(id: string): string {
    const count = countryById[id];
    if (!count) return '#f1f5f9'; // slate-100, unvisited
    const intensity = Math.min(count / maxVisits, 1);
    // Interpolate from light blue to deep blue
    const r = Math.round(239 - intensity * (239 - 37));
    const g = Math.round(246 - intensity * (246 - 99));
    const b = Math.round(255 - intensity * (255 - 235));
    return `rgb(${r}, ${g}, ${b})`;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Visitor Heat Map</h3>
      {Object.keys(countryData).length === 0 || (Object.keys(countryData).length === 1 && countryData['(unknown)']) ? (
        <p className="text-gray-500 text-sm">Geographic data will populate as visitors arrive from Vercel.</p>
      ) : (
        <>
          <div className="w-full overflow-hidden rounded-lg border border-gray-100">
            <ComposableMap
              projectionConfig={{ scale: 147, center: [0, 20] }}
              width={800}
              height={400}
              style={{ width: '100%', height: 'auto' }}
            >
              <ZoomableGroup>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const id = geo.id;
                      const visits = countryById[id] || 0;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getColor(id)}
                          stroke="#cbd5e1"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none', fill: '#3b82f6', cursor: 'pointer' },
                            pressed: { outline: 'none' },
                          }}
                          data-tooltip={visits > 0 ? `${geo.properties.name}: ${visits} visit${visits !== 1 ? 's' : ''}` : geo.properties.name}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded" style={{ background: '#f1f5f9' }} />
              <span>No visits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded" style={{ background: 'rgb(139, 173, 245)' }} />
              <span>Some visits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded" style={{ background: 'rgb(37, 99, 235)' }} />
              <span>Most visits</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(WorldHeatMap);
