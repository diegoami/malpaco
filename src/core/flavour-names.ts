// T94: regional flavour names (#170). Real islands and towns that belong to them, named
// for a sense of place only: geometry, topology and play never depend on them.
// Areas are approximate km² from each island's Wikipedia article; they only rank the
// islands. Towns are settlements on that island (its Wikipedia article and its
// municipality list). Every island lists at least ten towns, the largest generated
// island's size, so any selection can name any map.

import {DeterministicRng} from "./rng";

export const NAME_THEMES = ["mediterranean", "caribbean", "scandinavian", "malay", "pacific"] as const;
export type NameTheme = typeof NAME_THEMES[number];
/** "seed" picks a theme from the seed; "numbered" is the pre-T94 naming that old saves keep. */
export type NameChoice = NameTheme | "seed" | "numbered";

export const THEME_LABELS: Readonly<Record<NameTheme, string>> = {
  mediterranean: "Mediterranean",
  caribbean: "Caribbean",
  scandinavian: "Scandinavian islands",
  malay: "Malaysia and Indonesia",
  pacific: "Pacific",
};

interface RealIsland {readonly name: string; readonly area: number; readonly towns: readonly string[]}

export const THEMES: Readonly<Record<NameTheme, readonly RealIsland[]>> = {
  mediterranean: [
    {name: "Sicily", area: 25711, towns: ["Palermo", "Catania", "Messina", "Siracusa", "Trapani", "Marsala", "Ragusa", "Agrigento", "Gela", "Caltanissetta", "Enna", "Cefalù"]},
    {name: "Sardinia", area: 24090, towns: ["Cagliari", "Sassari", "Olbia", "Alghero", "Nuoro", "Oristano", "Iglesias", "Carbonia", "Tempio Pausania", "Porto Torres"]},
    {name: "Cyprus", area: 9251, towns: ["Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia", "Paralimni", "Morphou", "Polis", "Ayia Napa"]},
    {name: "Corsica", area: 8680, towns: ["Ajaccio", "Bastia", "Porto-Vecchio", "Calvi", "Corte", "Bonifacio", "Propriano", "Sartène", "L'Île-Rousse", "Ghisonaccia"]},
    {name: "Crete", area: 8336, towns: ["Heraklion", "Chania", "Rethymno", "Agios Nikolaos", "Ierapetra", "Sitia", "Kissamos", "Hersonissos", "Malia", "Moires"]},
    {name: "Euboea", area: 3684, towns: ["Chalcis", "Eretria", "Karystos", "Kymi", "Istiaia", "Aidipsos", "Limni", "Psachna", "Amarynthos", "Mantoudi"]},
    {name: "Mallorca", area: 3640, towns: ["Palma", "Manacor", "Inca", "Alcúdia", "Sóller", "Pollença", "Llucmajor", "Felanitx", "Calvià", "Santanyí"]},
    {name: "Lesbos", area: 1633, towns: ["Mytilene", "Molyvos", "Plomari", "Kalloni", "Eresos", "Agiasos", "Petra", "Mantamados", "Polichnitos", "Sigri"]},
    {name: "Rhodes", area: 1401, towns: ["Rhodes Town", "Lindos", "Ialysos", "Faliraki", "Archangelos", "Kremasti", "Afantou", "Embonas", "Kattavia", "Paradisi"]},
    {name: "Chios", area: 842, towns: ["Chios Town", "Vrontados", "Kardamyla", "Volissos", "Mesta", "Pyrgi", "Kalamoti", "Lagkada", "Thymiana", "Vessa"]},
    {name: "Corfu", area: 585, towns: ["Corfu Town", "Kassiopi", "Lefkimmi", "Paleokastritsa", "Gouvia", "Benitses", "Kavos", "Acharavi", "Sidari", "Moraitika"]},
    {name: "Malta", area: 246, towns: ["Valletta", "Mdina", "Birgu", "Sliema", "Rabat", "Mosta", "Naxxar", "Qormi", "Żebbuġ", "Marsaxlokk"]},
  ],
  caribbean: [
    {name: "Cuba", area: 104556, towns: ["Havana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara", "Guantánamo", "Bayamo", "Cienfuegos", "Matanzas", "Pinar del Río", "Sancti Spíritus"]},
    {name: "Hispaniola", area: 76192, towns: ["Santo Domingo", "Port-au-Prince", "Santiago de los Caballeros", "Cap-Haïtien", "La Romana", "Puerto Plata", "Les Cayes", "Gonaïves", "San Pedro de Macorís", "Jacmel"]},
    {name: "Jamaica", area: 10991, towns: ["Kingston", "Montego Bay", "Spanish Town", "Portmore", "Mandeville", "Ocho Rios", "Negril", "May Pen", "Port Antonio", "Falmouth"]},
    {name: "Puerto Rico", area: 8868, towns: ["San Juan", "Ponce", "Mayagüez", "Bayamón", "Caguas", "Arecibo", "Carolina", "Fajardo", "Aguadilla", "Humacao"]},
    {name: "Trinidad", area: 4768, towns: ["Port of Spain", "San Fernando", "Chaguanas", "Arima", "Point Fortin", "Sangre Grande", "Couva", "Tunapuna", "Siparia", "Princes Town"]},
    {name: "Guadeloupe", area: 1628, towns: ["Pointe-à-Pitre", "Basse-Terre", "Les Abymes", "Baie-Mahault", "Le Gosier", "Sainte-Anne", "Le Moule", "Saint-François", "Capesterre-Belle-Eau", "Sainte-Rose"]},
    {name: "Martinique", area: 1128, towns: ["Fort-de-France", "Le Lamentin", "Le Robert", "Schœlcher", "Sainte-Marie", "Le François", "Le Marin", "Saint-Pierre", "La Trinité", "Le Diamant"]},
    {name: "Dominica", area: 750, towns: ["Roseau", "Portsmouth", "Marigot", "Berekua", "Mahaut", "Wesley", "Castle Bruce", "Saint Joseph", "Calibishie", "La Plaine"]},
    {name: "Saint Lucia", area: 617, towns: ["Castries", "Gros Islet", "Vieux Fort", "Soufrière", "Micoud", "Dennery", "Laborie", "Anse La Raye", "Choiseul", "Canaries"]},
    {name: "Tobago", area: 300, towns: ["Scarborough", "Plymouth", "Roxborough", "Charlotteville", "Speyside", "Canaan", "Crown Point", "Bon Accord", "Moriah", "Castara"]},
    {name: "Antigua", area: 281, towns: ["St. John's", "All Saints", "Liberta", "Bolans", "English Harbour", "Parham", "Freetown", "Jennings", "Swetes", "Piggotts"]},
  ],
  scandinavian: [
    {name: "Zealand", area: 7031, towns: ["Copenhagen", "Roskilde", "Helsingør", "Hillerød", "Køge", "Næstved", "Holbæk", "Slagelse", "Ringsted", "Kalundborg"]},
    {name: "Vendsyssel-Thy", area: 4685, towns: ["Hjørring", "Frederikshavn", "Skagen", "Brønderslev", "Thisted", "Hirtshals", "Sæby", "Nørresundby", "Fjerritslev", "Hanstholm"]},
    {name: "Gotland", area: 2994, towns: ["Visby", "Hemse", "Slite", "Klintehamn", "Roma", "Burgsvik", "Fårösund", "Ljugarn", "Lärbro", "Tingstäde"]},
    {name: "Funen", area: 2985, towns: ["Odense", "Svendborg", "Nyborg", "Middelfart", "Faaborg", "Assens", "Kerteminde", "Bogense", "Ringe", "Otterup"]},
    {name: "Senja", area: 1586, towns: ["Silsand", "Gibostad", "Husøy", "Gryllefjord", "Skaland", "Fjordgård", "Torsken", "Botnhamn", "Senjahopen", "Stonglandseidet"]},
    {name: "Öland", area: 1342, towns: ["Borgholm", "Färjestaden", "Mörbylånga", "Köpingsvik", "Löttorp", "Böda", "Degerhamn", "Grönhögen", "Sandvik", "Byxelkrok"]},
    {name: "Lolland", area: 1243, towns: ["Nakskov", "Maribo", "Rødby", "Sakskøbing", "Rødbyhavn", "Søllested", "Horslunde", "Holeby", "Dannemare", "Stokkemarke"]},
    {name: "Åland", area: 685, towns: ["Mariehamn", "Jomala", "Finström", "Godby", "Saltvik", "Sund", "Eckerö", "Hammarland", "Lemland", "Lumparland"]},
    {name: "Bornholm", area: 588, towns: ["Rønne", "Nexø", "Aakirkeby", "Hasle", "Svaneke", "Allinge", "Gudhjem", "Sandvig", "Tejn", "Snogebæk"]},
    {name: "Falster", area: 514, towns: ["Nykøbing Falster", "Stubbekøbing", "Gedser", "Nørre Alslev", "Marielyst", "Eskilstrup", "Horbelev", "Væggerløse", "Idestrup", "Sundby"]},
  ],
  malay: [
    {name: "Borneo", area: 743330, towns: ["Pontianak", "Banjarmasin", "Balikpapan", "Samarinda", "Kuching", "Kota Kinabalu", "Sandakan", "Miri", "Sibu", "Bandar Seri Begawan", "Tawau", "Bintulu"]},
    {name: "Sumatra", area: 473481, towns: ["Medan", "Palembang", "Padang", "Pekanbaru", "Jambi", "Bengkulu", "Banda Aceh", "Bandar Lampung", "Bukittinggi", "Pematangsiantar"]},
    {name: "Sulawesi", area: 180681, towns: ["Makassar", "Manado", "Palu", "Kendari", "Gorontalo", "Bitung", "Parepare", "Palopo", "Tomohon", "Mamuju"]},
    {name: "Java", area: 138794, towns: ["Jakarta", "Surabaya", "Bandung", "Semarang", "Yogyakarta", "Malang", "Surakarta", "Bogor", "Cirebon", "Serang"]},
    {name: "Timor", area: 30777, towns: ["Kupang", "Dili", "Atambua", "Soe", "Kefamenanu", "Baucau", "Suai", "Maliana", "Same", "Viqueque"]},
    {name: "Halmahera", area: 17780, towns: ["Sofifi", "Tobelo", "Weda", "Jailolo", "Maba", "Galela", "Kao", "Sidangoli", "Subaim", "Buli"]},
    {name: "Sumbawa", area: 15448, towns: ["Bima", "Sumbawa Besar", "Dompu", "Taliwang", "Sape", "Empang", "Alas", "Utan", "Plampang", "Lunyuk"]},
    {name: "Flores", area: 13540, towns: ["Maumere", "Ende", "Labuan Bajo", "Ruteng", "Bajawa", "Larantuka", "Borong", "Mbay", "Moni", "Riung"]},
    {name: "Bali", area: 5780, towns: ["Denpasar", "Singaraja", "Ubud", "Kuta", "Gianyar", "Tabanan", "Amlapura", "Negara", "Semarapura", "Bangli"]},
    {name: "Lombok", area: 4725, towns: ["Mataram", "Praya", "Selong", "Gerung", "Tanjung", "Senggigi", "Labuhan Lombok", "Sembalun", "Masbagik", "Kopang"]},
    {name: "Madura", area: 4078, towns: ["Bangkalan", "Sampang", "Pamekasan", "Sumenep", "Kamal", "Arosbaya", "Ketapang", "Kalianget", "Tanah Merah", "Galis"]},
    {name: "Penang", area: 293, towns: ["George Town", "Bayan Lepas", "Balik Pulau", "Tanjung Bungah", "Batu Ferringhi", "Air Itam", "Gelugor", "Jelutong", "Tanjung Tokong", "Teluk Bahang"]},
  ],
  pacific: [
    {name: "New Guinea", area: 785753, towns: ["Port Moresby", "Jayapura", "Lae", "Mount Hagen", "Madang", "Wewak", "Goroka", "Sorong", "Merauke", "Manokwari", "Timika"]},
    {name: "South Island", area: 150437, towns: ["Christchurch", "Dunedin", "Nelson", "Invercargill", "Queenstown", "Timaru", "Blenheim", "Greymouth", "Oamaru", "Ashburton", "Kaikōura"]},
    {name: "North Island", area: 113729, towns: ["Auckland", "Wellington", "Hamilton", "Tauranga", "Napier", "Rotorua", "Palmerston North", "Whangārei", "New Plymouth", "Gisborne"]},
    {name: "New Britain", area: 35145, towns: ["Kokopo", "Rabaul", "Kimbe", "Kandrian", "Hoskins", "Bialla", "Pomio", "Talasea", "Gasmata", "Kerevat"]},
    {name: "Grande Terre", area: 16372, towns: ["Nouméa", "Dumbéa", "Mont-Dore", "Païta", "Koné", "Bourail", "La Foa", "Poindimié", "Houaïlou", "Thio"]},
    {name: "Hawaiʻi", area: 10432, towns: ["Hilo", "Kailua-Kona", "Waimea", "Captain Cook", "Pāhoa", "Honokaʻa", "Volcano", "Kealakekua", "Hawi", "Nāʻālehu"]},
    {name: "Viti Levu", area: 10388, towns: ["Suva", "Nadi", "Lautoka", "Nausori", "Ba", "Sigatoka", "Rakiraki", "Tavua", "Navua", "Korovou"]},
    {name: "Maui", area: 1883, towns: ["Kahului", "Wailuku", "Lahaina", "Kīhei", "Makawao", "Pāʻia", "Hāna", "Kula", "Pukalani", "Nāpili"]},
    {name: "Oʻahu", area: 1545, towns: ["Honolulu", "Kailua", "Kāneʻohe", "Pearl City", "Waipahu", "Haleʻiwa", "Wahiawā", "Waimānalo", "Kapolei", "ʻEwa Beach"]},
    {name: "Upolu", area: 1125, towns: ["Apia", "Faleolo", "Lufilufi", "Falefa", "Siumu", "Lalomanu", "Mulifanua", "Leulumoega", "Poutasi", "Saleimoa"]},
    {name: "Tahiti", area: 1045, towns: ["Papeete", "Faʻaʻā", "Punaauia", "Pirae", "Mahina", "Papara", "Taravao", "Arue", "Paea", "Teahupoʻo"]},
  ],
};

/** [designed] Naming draws from its own stream, seeded from the game seed and this salt, never the game's RNG. */
const NAME_SALT = 0x6e616d65;

function shuffled<T>(rng: DeterministicRng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** The theme a choice names: "seed" picks one from the seed; "numbered" keeps the pre-T94 names. */
export function themeFor(choice: NameChoice, seed: number): NameTheme | null {
  if (choice === "numbered") return null;
  if (choice !== "seed") return choice;
  return NAME_THEMES[new DeterministicRng((seed ^ NAME_SALT) >>> 0).nextInt(0, NAME_THEMES.length - 1)]!;
}

export interface NamedIsland {readonly id: string; readonly provinces: readonly string[]; readonly area: number}

/**
 * Names a generated map from a theme. The larger generated island (more countries, then
 * more land, then id) takes the larger real island, and its countries take that island's towns.
 */
export function flavourNames(theme: NameTheme, seed: number, islands: readonly NamedIsland[]): {islands: Record<string, string>; provinces: Record<string, string>} {
  const pool = THEMES[theme], rng = new DeterministicRng((seed ^ NAME_SALT ^ 0x9e3779b9) >>> 0);
  if (islands.length > pool.length) throw new Error(`${theme} names at most ${pool.length} islands`);
  const real = shuffled(rng, pool).slice(0, islands.length).sort((a, b) => b.area - a.area);
  const generated = [...islands].sort((a, b) => b.provinces.length - a.provinces.length || b.area - a.area || (a.id < b.id ? -1 : 1));
  const names = {islands: {} as Record<string, string>, provinces: {} as Record<string, string>};
  generated.forEach((island, rank) => {
    const source = real[rank]!;
    if (island.provinces.length > source.towns.length) throw new Error(`${source.name} has too few towns`);
    names.islands[island.id] = source.name;
    const towns = shuffled(rng, source.towns);
    island.provinces.forEach((id, i) => { names.provinces[id] = towns[i]!; });
  });
  return names;
}
