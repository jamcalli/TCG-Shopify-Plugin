export type ScryfallColor = 'W' | 'U' | 'B' | 'R' | 'G';

export type ScryfallRarity = 'common' | 'uncommon' | 'rare' | 'special' | 'mythic' | 'bonus';

export type ScryfallLayout =
  | 'normal'
  | 'split'
  | 'flip'
  | 'transform'
  | 'modal_dfc'
  | 'meld'
  | 'leveler'
  | 'class'
  | 'case'
  | 'saga'
  | 'adventure'
  | 'mutate'
  | 'prototype'
  | 'battle'
  | 'planar'
  | 'scheme'
  | 'vanguard'
  | 'token'
  | 'double_faced_token'
  | 'emblem'
  | 'augment'
  | 'host'
  | 'art_series'
  | 'reversible_card';

export type ScryfallLegality = 'legal' | 'not_legal' | 'restricted' | 'banned';

export type ScryfallGame = 'paper' | 'arena' | 'mtgo';

export type ScryfallFinish = 'nonfoil' | 'foil' | 'etched' | 'glossy';

export type ScryfallFrameEffect =
  | 'legendary'
  | 'miracle'
  | 'nyxtouched'
  | 'draft'
  | 'devoid'
  | 'tombstone'
  | 'colorshifted'
  | 'inverted'
  | 'sunmoondfc'
  | 'compasslanddfc'
  | 'originpwdfc'
  | 'mooneldrazidfc'
  | 'waxingandwaningmoondfc'
  | 'showcase'
  | 'extendedart'
  | 'companion'
  | 'etched'
  | 'snow'
  | 'lesson'
  | 'shatteredglass'
  | 'convertdfc'
  | 'fandfc'
  | 'upsidedowndfc';

export type ScryfallBorderColor = 'black' | 'white' | 'borderless' | 'silver' | 'gold';

export type ScryfallSecurityStamp = 'oval' | 'triangle' | 'acorn' | 'circle' | 'arena' | 'heart';

export interface ScryfallImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
}

export interface ScryfallPrices {
  usd?: string | null;
  usd_foil?: string | null;
  usd_etched?: string | null;
  eur?: string | null;
  eur_foil?: string | null;
  tix?: string | null;
}

export interface ScryfallPurchaseUris {
  tcgplayer?: string;
  cardmarket?: string;
  cardhoarder?: string;
}

export interface ScryfallRelatedUris {
  gatherer?: string;
  tcgplayer_infinite_articles?: string;
  tcgplayer_infinite_decks?: string;
  edhrec?: string;
}

export interface ScryfallLegalities {
  standard: ScryfallLegality;
  future: ScryfallLegality;
  historic: ScryfallLegality;
  timeless: ScryfallLegality;
  gladiator: ScryfallLegality;
  pioneer: ScryfallLegality;
  explorer: ScryfallLegality;
  modern: ScryfallLegality;
  legacy: ScryfallLegality;
  pauper: ScryfallLegality;
  vintage: ScryfallLegality;
  penny: ScryfallLegality;
  commander: ScryfallLegality;
  oathbreaker: ScryfallLegality;
  brawl: ScryfallLegality;
  historicbrawl: ScryfallLegality;
  alchemy: ScryfallLegality;
  paupercommander: ScryfallLegality;
  duel: ScryfallLegality;
  oldschool: ScryfallLegality;
  premodern: ScryfallLegality;
  predh: ScryfallLegality;
}

export interface ScryfallCardFace {
  artist?: string;
  cmc?: number;
  color_indicator?: ScryfallColor[];
  colors?: ScryfallColor[];
  defense?: string;
  flavor_text?: string;
  illustration_id?: string;
  image_uris?: ScryfallImageUris;
  layout?: ScryfallLayout;
  loyalty?: string;
  mana_cost: string;
  name: string;
  object: 'card_face';
  oracle_id?: string;
  oracle_text?: string;
  power?: string;
  printed_name?: string;
  printed_text?: string;
  printed_type_line?: string;
  toughness?: string;
  type_line?: string;
  watermark?: string;
}

export interface ScryfallRelatedCard {
  id: string;
  object: 'related_card';
  component: 'token' | 'meld_part' | 'meld_result' | 'combo_piece';
  name: string;
  type_line: string;
  uri: string;
}

export interface ScryfallCardPreview {
  previewed_at?: string;
  source_uri?: string;
  source?: string;
}

export interface ScryfallCard {
  // Core Fields
  arena_id?: number;
  id: string;
  lang: string;
  mtgo_id?: number;
  mtgo_foil_id?: number;
  multiverse_ids?: number[];
  tcgplayer_id?: number;
  tcgplayer_etched_id?: number;
  cardmarket_id?: number;
  object: 'card';
  oracle_id?: string;
  prints_search_uri: string;
  rulings_uri: string;
  scryfall_uri: string;
  uri: string;

  // Gameplay Fields
  all_parts?: ScryfallRelatedCard[];
  card_faces?: ScryfallCardFace[];
  cmc: number;
  color_identity: ScryfallColor[];
  color_indicator?: ScryfallColor[];
  colors?: ScryfallColor[];
  defense?: string;
  edhrec_rank?: number;
  hand_modifier?: string;
  keywords: string[];
  layout: ScryfallLayout;
  legalities: ScryfallLegalities;
  life_modifier?: string;
  loyalty?: string;
  mana_cost?: string;
  name: string;
  oracle_text?: string;
  penny_rank?: number;
  power?: string;
  produced_mana?: ScryfallColor[];
  reserved: boolean;
  toughness?: string;
  type_line: string;

  // Print Fields
  artist?: string;
  artist_ids?: string[];
  attraction_lights?: number[];
  booster: boolean;
  border_color: ScryfallBorderColor;
  card_back_id?: string;
  collector_number: string;
  content_warning?: boolean;
  digital: boolean;
  finishes: ScryfallFinish[];
  flavor_name?: string;
  flavor_text?: string;
  frame_effects?: ScryfallFrameEffect[];
  frame: string;
  full_art: boolean;
  games: ScryfallGame[];
  highres_image: boolean;
  illustration_id?: string;
  image_status: 'missing' | 'placeholder' | 'lowres' | 'highres_scan';
  image_uris?: ScryfallImageUris;
  oversized: boolean;
  prices: ScryfallPrices;
  printed_name?: string;
  printed_text?: string;
  printed_type_line?: string;
  promo: boolean;
  promo_types?: string[];
  purchase_uris?: ScryfallPurchaseUris;
  rarity: ScryfallRarity;
  related_uris?: ScryfallRelatedUris;
  released_at: string;
  reprint: boolean;
  scryfall_set_uri: string;
  set_name: string;
  set_search_uri: string;
  set_type: string;
  set_uri: string;
  set: string;
  set_id: string;
  story_spotlight: boolean;
  textless: boolean;
  variation: boolean;
  variation_of?: string;
  security_stamp?: ScryfallSecurityStamp;
  watermark?: string;
  preview?: ScryfallCardPreview;
}

export interface ScryfallBulkData {
  object: 'bulk_data';
  id: string;
  type: 'oracle_cards' | 'unique_artwork' | 'default_cards' | 'all_cards' | 'rulings';
  updated_at: string;
  uri: string;
  name: string;
  description: string;
  compressed_size: number;
  download_uri: string;
  content_type: string;
  content_encoding: string;
}

export interface ScryfallList<T> {
  object: 'list';
  has_more: boolean;
  next_page?: string;
  total_cards?: number;
  warnings?: string[];
  data: T[];
}

export interface ScryfallError {
  object: 'error';
  code: string;
  status: number;
  warnings?: string[];
  details: string;
  type?: string;
}

export interface ScryfallRuling {
  object: 'ruling';
  oracle_id: string;
  source: 'wotc' | 'scryfall';
  published_at: string;
  comment: string;
}