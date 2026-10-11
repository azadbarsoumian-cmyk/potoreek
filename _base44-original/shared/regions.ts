// Region taxonomy + keyword classifier for Story records (server side).
// The frontend keeps its own copy of the display/coordinate data in
// src/lib/regions.js — base44/ modules cannot be imported by pages.

export const REGIONS = [
  { key: 'Sasun', am: 'Սասուն', lat: 38.54, lng: 41.57, keywords: ['Սաս', 'Sasun'] },
  { key: 'Zeitun', am: 'Զէյթուն', lat: 37.65, lng: 36.45, keywords: ['Զէյթուն', 'Zeitun'] },
  { key: 'Urmia', am: 'Ուրմիա-Սալմաստ', lat: 37.55, lng: 45.07, keywords: ['Ուրմիա', 'Սալմաստ', 'Պարսկաստան', 'Urmia', 'Salmas'] },
  { key: 'Mush-Bitlis', am: 'Մուշ-Բիթլիս', lat: 38.99, lng: 41.5, keywords: ['Մուշ', 'Բիթլիս', 'Mush', 'Bitlis'] },
  { key: 'Erzurum', am: 'Էրզրում', lat: 39.9, lng: 41.27, keywords: ['Էրզրում', 'Էրզերում', 'Կարին', 'Erzurum', 'Karin'] },
  { key: 'Kars', am: 'Կարս', lat: 40.6, lng: 43.09, keywords: ['Կարս', 'Անի', 'Kars', 'Ani'] },
  { key: 'Van', am: 'Վան', lat: 38.49, lng: 43.38, keywords: ['Վան', 'Վասպուրական', 'Աղթամար'] },
  { key: 'Trabzon', am: 'Պոնտոս-Տրապիզոն', lat: 41.0, lng: 39.72, keywords: ['Տրապիզոն', 'Պոնտոս', 'Trabzon', 'Pontus'] },
  { key: 'Cilicia', am: 'Կիլիկիա-Ադանա', lat: 37.0, lng: 35.32, keywords: ['Կիլիկիա', 'Ատանա', 'Ադանա', 'Մարաշ', 'Հաճըն', 'Եղիւպ', 'Սիս', 'Cilicia', 'Adana', 'Marash', 'Hadjin'] },
  { key: 'Baku', am: 'Պաքու', lat: 40.41, lng: 49.87, keywords: ['Պաքու', 'Գանձակ', 'Արցախ', 'Ղարաբաղ', 'Baku', 'Karabakh'] },
  { key: 'Tiflis', am: 'Թիֆլիս', lat: 41.72, lng: 44.79, keywords: ['Թիֆլիս', 'Թիֆլիզ', 'Վրաստան', 'Վրաց', 'Tiflis', 'Georgia'] },
  { key: 'Yerevan', am: 'Երեւան', lat: 40.18, lng: 44.51, keywords: ['Երեւան', 'Ալեքսանդրապոլ', 'Կումայրի', 'Էջմիածին', 'Yerevan', 'Alexandropol', 'Etchmiadzin'] },
  { key: 'Constantinople', am: 'Կ. Պոլիս', lat: 41.01, lng: 28.98, keywords: ['Պոլիս', 'Կոստանդնուպոլիս', 'Constantinople', 'Istanbul'] },
  { key: 'Europe', am: 'Եւրոպա', lat: 46.2, lng: 6.14, keywords: ['Ժընեւ', 'Ժինեւ', 'Զիւրիխ', 'Փարիզ', 'Մարսէյ', 'Սոֆիա', 'Լոնտոն', 'Պուլկար', 'Բուխարեստ', 'Ռումանիա', 'Աթէնք', 'Յունաստան', 'Մոսկուա', 'Ռուսաստան', 'Geneva', 'Paris', 'Sofia', 'London', 'Bucharest', 'Athens', 'Moscow'] },
  { key: 'North America', am: 'Հիւսիսային Ամերիկա', lat: 42.36, lng: -71.06, keywords: ['Ամերիկա', 'Պոստոն', 'Նիւ Եորք', 'Ֆրեզնո', 'Քանատա', 'Տորոնթո', 'Գալիֆորնի', 'America', 'Boston', 'Fresno', 'Toronto', 'California'] },
  { key: 'Other', am: 'Այլ' },
];

// Second pass: lowercase place names as they appear mid-sentence in running
// Armenian text. Left letter-boundary so e.g. 'զմուշ' does not match 'մուշ'.
// Deliberately excluded: 'վան' (matches 'վանք', monastery), 'կարին' (matches
// the verb "they had"), 'անի' (matches countless words).
const LOWER_TOKENS = [
  ['Sasun', ['սասուն', 'սասն']],
  ['Zeitun', ['զէյթուն']],
  ['Urmia', ['ուրմիա', 'սալմաստ', 'պարսկաստան']],
  ['Mush-Bitlis', ['մուշ', 'բիթլիս']],
  ['Erzurum', ['էրզրում', 'էրզերում']],
  ['Kars', ['կարս']],
  ['Trabzon', ['տրապիզոն', 'պոնտոս']],
  ['Cilicia', ['կիլիկիա', 'ատանա', 'ադանա', 'մարաշ', 'հաճըն', 'եղիւպ']],
  ['Baku', ['պաքու', 'գանձակ', 'արցախ', 'ղարաբաղ']],
  ['Tiflis', ['թիֆլիս', 'թիֆլիզ', 'վրաստան', 'վրաց']],
  ['Yerevan', ['երեւան', 'ալեքսանդրապոլ', 'կումայրի', 'էջմիածին']],
  ['Constantinople', ['պոլիս', 'կոստանդնուպոլիս']],
  ['Europe', ['ժընեւ', 'ժինեւ', 'զիւրիխ', 'փարիզ', 'մարսէյ', 'սոֆիա', 'լոնտոն', 'պուլկար', 'բուխարեստ', 'ռումանիա', 'աթէնք', 'յունաստան', 'մոսկուա', 'ռուսաստան']],
  ['North America', ['ամերիկա', 'պոստոն', 'նիւ եորք', 'ֆրեզնո', 'քանատա', 'տորոնթո']],
];
const LOWER_REGEXPS = LOWER_TOKENS.map(([regionKey, tokens]) =>
  [regionKey, tokens.map((t) => new RegExp('(?<![\\u0531-\\u0587])' + t, 'u'))]
);

// Priority = array order; first region whose keyword appears wins.
export function classifyStoryRegion(text) {
  const hay = text || '';
  for (const region of REGIONS) {
    for (const kw of region.keywords || []) {
      if (hay.includes(kw)) return region.key;
    }
  }
  const lower = hay.toLowerCase();
  for (const [regionKey, regexps] of LOWER_REGEXPS) {
    for (const re of regexps) {
      if (re.test(lower)) return regionKey;
    }
  }
  return 'Other';
}

export function regionByKey(key) {
  return REGIONS.find((r) => r.key === key);
}