export type Project = {
  id: string;
  title: string;
  area: string;
  status: "plan" | "studie" | "uitvoering" | "realisatie" | "afronding" | "afgerond";
  summary: string;
  start: number;
  end: number;
  type: string;
  lat: number;
  lon: number;
};

export const PROJECTS: Project[] = [
  // --- Porthos (toegevoegd/geborgd) ---
  {
    id: "porthos-co2",
    title: "Porthos – CO₂-opslag onder de Noordzee",
    area: "Maasvlakte / Noordzee",
    status: "uitvoering",
    summary:
      "Industriële CO₂ wordt afgevangen en opgeslagen in lege gasvelden onder de Noordzee. Belangrijk klimaatproject om uitstoot snel te verlagen.",
    start: 2023,
    end: 2026,
    type: "energie, klimaat",
    lat: 51.963,
    lon: 4.003
  },

  // --- Bestaande/voorbeeld items ---
  {
    id: "holland-hydrogen-i",
    title: "Holland Hydrogen I – groene waterstof (Shell)",
    area: "Maasvlakte",
    status: "uitvoering",
    summary:
      "Productie van groene waterstof met windenergie. Vermindert uitstoot in de haven.",
    start: 2023,
    end: 2025,
    type: "waterstof, energie",
    lat: 51.962,
    lon: 3.995
  },
  {
    id: "walstroom-amerikakade",
    title: "Walstroom – Holland Amerikakade (cruise)",
    area: "Stadshavens",
    status: "realisatie",
    summary:
      "Walstroom voor cruiseschepen: minder geluid en schonere lucht aan de kade.",
    start: 2023,
    end: 2024,
    type: "walstroom, luchtkwaliteit",
    lat: 51.905,
    lon: 4.486
  },
  {
    id: "cer",
    title: "Container Exchange Route (CER)",
    area: "Maasvlakte",
    status: "realisatie",
    summary:
      "Interne baan voor containervervoer tussen terminals. Minder vrachtverkeer op de weg.",
    start: 2019,
    end: 2024,
    type: "logistiek, infrastructuur",
    lat: 51.973,
    lon: 4.030
  },

  // --- Nieuwe punten (10+) voor Rotterdam/haven ---
  {
    id: "rijnhavenpark",
    title: "Rijnhavenpark – Waterfrontontwikkeling",
    area: "Rijnhaven",
    status: "realisatie",
    summary:
      "Nieuwe groene verblijfsruimte aan het water met ruimte voor recreatie en natuur.",
    start: 2022,
    end: 2025,
    type: "vergroening, openbare ruimte",
    lat: 51.9059,
    lon: 4.4915
  },
  {
    id: "walstroom-waalhaven",
    title: "Walstroom – Waalhaven",
    area: "Waalhaven",
    status: "uitvoering",
    summary:
      "Walstroom voor zeeschepen vermindert uitstoot en geluid tijdens ligdagen.",
    start: 2023,
    end: 2026,
    type: "walstroom, luchtkwaliteit, energie",
    lat: 51.889,
    lon: 4.448
  },
  {
    id: "hart-van-zuid",
    title: "Hart van Zuid – Gebiedsvernieuwing",
    area: "Zuidplein / Hart van Zuid",
    status: "realisatie",
    summary:
      "Versterking centrum Zuid: nieuw OV-knooppunt, voorzieningen en woningen.",
    start: 2019,
    end: 2025,
    type: "gebiedsontwikkeling, mobiliteit, wonen",
    lat: 51.8895,
    lon: 4.49
  },
  {
    id: "m4h-innovatiedistrict",
    title: "Merwe-Vierhavens (M4H) – Innovatiedistrict",
    area: "Stadshavens",
    status: "plan",
    summary:
      "Transitie van havengebied naar innovatief werk- en woongebied met circulaire bedrijvigheid.",
    start: 2020,
    end: 2035,
    type: "innovatie, circulaire economie",
    lat: 51.909,
    lon: 4.424
  },
  {
    id: "nieuwe-maaslijn",
    title: "Nieuwe Maaslijn – nieuwe oeververbinding (OV)",
    area: "Rotterdam breed",
    status: "studie",
    summary:
      "Onderzoek naar een extra OV-verbinding over de Maas voor betere bereikbaarheid.",
    start: 2023,
    end: 2028,
    type: "mobiliteit, ov-verbinding",
    lat: 51.92,
    lon: 4.49
  },
  {
    id: "park-maashaven",
    title: "Park Maashaven – nieuw stadspark",
    area: "Maashaven",
    status: "realisatie",
    summary:
      "Een nieuw (deels drijvend) park voor meer groen, koelte en verblijfskwaliteit op Zuid.",
    start: 2024,
    end: 2027,
    type: "vergroening, leefbaarheid",
    lat: 51.893,
    lon: 4.497
  },
  {
    id: "hoekse-lijn-boulevard",
    title: "Hoekse Lijn – Verlenging Strandboulevard",
    area: "Hoek van Holland",
    status: "uitvoering",
    summary:
      "Verbeterde bereikbaarheid van strand en boulevard door de verlengde metrolijn.",
    start: 2021,
    end: 2025,
    type: "mobiliteit, toerisme",
    lat: 51.977,
    lon: 4.127
  },
  {
    id: "warmtelinq",
    title: "WarmtelinQ – Regionaal warmtenet",
    area: "Rijnmond",
    status: "uitvoering",
    summary:
      "Aanleg van warmteleiding die restwarmte uit de haven inzet voor woningen en bedrijven.",
    start: 2022,
    end: 2027,
    type: "energie, duurzaamheid",
    lat: 51.93,
    lon: 4.42
  },
  {
    id: "groene-corridor",
    title: "De Groene Corridor – Fietssnelroute",
    area: "West / Schiedam",
    status: "afgerond",
    summary:
      "Snelle fietsverbinding door groen gebied tussen centrum en Delft; stimuleert fietsen.",
    start: 2018,
    end: 2021,
    type: "mobiliteit, fiets, recreatie",
    lat: 51.927,
    lon: 4.37
  },
  {
    id: "zalmhavengebied",
    title: "Zalmhavengebied – Hoogbouw & openbare ruimte",
    area: "Centrum",
    status: "afronding",
    summary:
      "Herontwikkeling met woontorens en verbeterde openbare ruimte bij de Maas.",
    start: 2017,
    end: 2024,
    type: "wonen, hoogbouw, openbare ruimte",
    lat: 51.911,
    lon: 4.48
  },
  {
    id: "haven-batterij",
    title: "Havenbatterij – Netstabiliteit met opslag",
    area: "Botlek",
    status: "plan",
    summary:
      "Grote batterij voor piekopslag en netbalancering; helpt verduurzamen van het stroomnet in de haven.",
    start: 2025,
    end: 2028,
    type: "energieopslag, netcapaciteit",
    lat: 51.873,
    lon: 4.301
  },

  // --- Cruise Terminal Rotterdam (licht verschoven om overlap te voorkomen) ---
  {
    id: "cruise-terminal-rotterdam",
    title: "Cruise Terminal Rotterdam – Wilhelminapier",
    area: "Wilhelminapier / Kop van Zuid",
    status: "afgerond",
    summary:
      "Toeristisch icoon aan de Maas. Laat de haven zien als stadshub met veel bezoekersinteractie.",
    start: 1997,
    end: 1997,
    type: "toerisme, stedelijke hub",
    lat: 51.9047,  // iets naar links verschoven
    lon: 4.4852
  },



];

/**
 * Postcode -> gebied hints (voor je zoekfunctie)
 * Voeg gerust meer toe als je wilt verfijnen.
 */
export const POSTCODE_AREAS: Record<string, string> = {
  "3199": "Maasvlakte",
  "3087": "Waalhaven",
  "3072": "Kop van Zuid",
  "3071": "Katendrecht",
  "3025": "Merwe-Vierhavens",
  "3011": "Centrum",
  "3016": "Scheepvaartkwartier",
  "3151": "Hoek van Holland",
  "3081": "Zuidplein",
  "3073": "Maashaven"
};
