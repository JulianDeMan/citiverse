export type Project = {
id: string;
title: string;
area: string;
status: string;
start: string;
ready: string;
impact: { geluid: string; verkeer: string; lucht: string };
type: string[];
lat: number;
lon: number;
summary: string;
source?: string; // optioneel
};


export const PROJECTS: Project[] = [
{
id: 'porthos',
title: 'Porthos – CO₂-opslag Noordzee',
area: 'Maasvlakte',
status: 'in aanbouw',
start: '2024',
ready: '2026',
impact: { geluid: 'laag', verkeer: 'laag', lucht: 'positief (CO₂‑reductie)' },
type: ['energietransitie', 'industrie'],
lat: 51.95,
lon: 3.98,
summary: 'Opslag van ~2,5 Mton CO₂ per jaar in lege gasvelden (verwacht 2026).',
source: '/mnt/data/voortgangsrapportage-herijkte-havenvisie-rotterdam-februari-2024-2.pdf',
},
{
id: 'h2-hhi',
title: 'Holland Hydrogen I – groene waterstof (Shell)',
area: 'Tweede Maasvlakte',
status: 'bouw',
start: '2022',
ready: '2025',
impact: { geluid: 'laag', verkeer: 'beperkt', lucht: 'positief (minder uitstoot)' },
type: ['energietransitie', 'waterstof'],
lat: 51.94,
lon: 4.02,
summary: 'Elektrolyser (200 MW) voor groene waterstof – schonere industrie/scheepvaart.',
source: '/mnt/data/voortgangsrapportage-herijkte-havenvisie-rotterdam-februari-2024-2.pdf',
},
{
id: 'walstroom-cruise',
title: 'Walstroom – Holland Amerikakade (cruise)',
area: 'Stadshavens',
status: 'realisatie',
start: '2023',
ready: '2024',
impact: { geluid: 'lager aan de kade', verkeer: 'neutraal', lucht: 'beter (minder uitstoot)' },
type: ['walstroom', 'luchtkwaliteit'],
lat: 51.907,
lon: 4.483,
summary: 'Walstroom voor cruiseschepen: minder geluid en schonere lucht aan de kade.',
source: '/mnt/data/voortgangsrapportage-herijkte-havenvisie-rotterdam-februari-2024-2.pdf',
},
{
id: 'cer',
title: 'Container Exchange Route (CER)',
area: 'Maasvlakte',
status: 'in gebruik',
start: '2023',
ready: '2023',
impact: { geluid: 'lager op openbare wegen', verkeer: 'veiliger', lucht: 'beter (efficiënter)' },
type: ['logistiek', 'veiligheid'],
lat: 51.963,
lon: 4.003,
summary: 'Gesloten wegennetwerk tussen terminals/depots – veiliger, sneller, minder hinder.',
source: '/mnt/data/voortgangsrapportage-herijkte-havenvisie-rotterdam-februari-2024-2.pdf',
},
];


export const POSTCODE_AREAS: Record<string, string> = {
'3199': 'Maasvlakte',
'3087': 'Waalhaven/Zuid',
'3011': 'Centrum',
'3133': 'Vlaardingen Haven',
};