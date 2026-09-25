// ============================================================
//  DungeonRogue (第一章: 霧渡り森 / 1-1 〜 1-10)
//
//  ◆ 画像差し替えガイド
//  すべての絵素材は下の ASSETS レジストリで一元管理しています。
//  各エントリの img に画像URLを入れると、アイコンの代わりに
//  その画像が表示されます(nullのままならアイコン表示)。
//    例: dagger: { icon: "Sword", img: "https://.../dagger.png" }
//  敵・武器・防具・アイテム・背景すべて同じ仕組みです。
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Sword, Swords, Axe, Crosshair, Navigation2, BookOpen, Wand2, Music,
  Shield, Gem, Apple, Leaf, Flame, Zap, Sparkles, Ghost, Bug, Bird,
  TreePine, Droplets, Flower2, Crown, Skull, Heart, Package, Moon, Star,
  ChevronRight, X, Plus, Wind, CircleDot,
  Cloud, Mountain, Eye, Bone, Snowflake, Sprout, Waves, Shell, Sun,
  Volume1, Volume2, VolumeX,
  Settings, ExternalLink, Lock, LockOpen,
  Cat, Fish, Rabbit, Dog, Squirrel,
  Bot, Scale, EyeClosed, PiggyBank, Atom, Baby, Flower, Dna, Fan, Pyramid, Cherry, Origami, Egg, Snail, Disc2, Turtle, Shrimp,
} from "lucide-react";

// App Store 上の本アプリ(ダンジョンローグ)の数値 ID。レビュー投稿・他アプリ導線で使用。
const APP_STORE_ID = "6788750579";
const DEVELOPER_URL = "https://apps.apple.com/developer/eiki-ogawa/id1701253076";


/* ------------------------------------------------------------
   素材レジストリ(ここを編集すれば見た目を差し替え可能)
------------------------------------------------------------ */
const ASSETS = {
  // 武器 8種
  dagger:     { icon: Sword,       img: null },
  greatsword: { icon: Swords,      img: null },
  bow:        { icon: Crosshair,   img: null },
  axe:        { icon: Axe,         img: null },
  spear:      { icon: Navigation2, img: null },
  book:       { icon: BookOpen,    img: null },
  staff:      { icon: Wand2,       img: null },
  instrument: { icon: Music,       img: null },
  // 防具・アイテム
  helm:       { icon: Shield,      img: null },
  armor:      { icon: Shield,      img: null },
  charm:      { icon: Gem,         img: null },
  berrySmall: { icon: Apple,       img: null },
  berryBig:   { icon: Heart,       img: null },
  antidote:   { icon: Leaf,        img: null },
  spore:      { icon: Zap,         img: null },
  bomb:       { icon: Flame,       img: null },
  dew:        { icon: Sparkles,    img: null },
  mossHeart:  { icon: CircleDot,   img: null },
  // 敵(第1章: 霧渡りの森)
  slime:      { icon: Droplets,    img: null },
  beetle:     { icon: Bug,         img: null },
  wisp:       { icon: Ghost,       img: null },
  raven:      { icon: Bird,        img: null },
  treant:     { icon: TreePine,    img: null },
  shroom:     { icon: Flower2,     img: null },
  goldSprite: { icon: Sparkles,    img: null },
  lostChild:  { icon: Baby,        img: null },
  // 敵(第2章: 茸の湿原)
  bogSlime:   { icon: Droplets,    img: null },
  sporeling:  { icon: Sprout,      img: null },
  mudcrab:    { icon: Shell,       img: null },
  leech:      { icon: Waves,       img: null },
  mutantFungus:{ icon: Dna,        img: null },
  // 敵(第3章: 苔の遺跡)
  statue:     { icon: Mountain,    img: null },
  skel:       { icon: Skull,       img: null },
  curseEye:   { icon: Eye,         img: null },
  ruinBat:    { icon: Cat,         img: null },
  ruinTurtle: { icon: Turtle,      img: null },
  ruinPyramid:{ icon: Pyramid,    img: null },
  // 敵(第1章追加)
  enchantedRabbit: { icon: Rabbit, img: null },
  // 敵(第2章: 茸の湿原 追加)
  bogFish:    { icon: Fish,        img: null },
  // 敵(第7章: 氷樹の森 追加)
  snowHound:  { icon: Dog,         img: null },
  // 敵(第4章: 花霞の谷)
  bee:        { icon: Bug,         img: null },
  petalGuard: { icon: Flower2,     img: null },
  pixie:      { icon: Sparkles,    img: null },
  thornVine:  { icon: Sprout,      img: null },
  roseThorn:  { icon: Cherry,      img: null },
  // 敵(第5章: 水晶洞)
  crysTurtle: { icon: Shell,       img: null },
  prism:      { icon: Gem,         img: null },
  crysBug:    { icon: Bug,         img: null },
  shardWisp:  { icon: Ghost,       img: null },
  crystalSnail:{ icon: Snail,      img: null },
  crystalDisc: { icon: Disc2,      img: null },
  // 敵(第6章: 焔の峠)
  salamander: { icon: Flame,       img: null },
  ashWraith:  { icon: Ghost,       img: null },
  magmaBug:   { icon: Bug,         img: null },
  emberBird:  { icon: Bird,        img: null },
  fireShrimp: { icon: Shrimp,      img: null },
  // 敵(第7章: 氷樹の森)
  blizzWolf:  { icon: Wind,        img: null },
  iceSprite:  { icon: Snowflake,   img: null },
  frostShroom:{ icon: Flower2,     img: null },
  icicleTort: { icon: Shell,       img: null },
  greedySpirit:{ icon: PiggyBank,  img: null },
  // 敵(第8章: 雷雲の尾根)
  stormBird:  { icon: Bird,        img: null },
  cloudEater: { icon: Cloud,       img: null },
  voltBug:    { icon: Zap,         img: null },
  galeSprite: { icon: Wind,        img: null },
  mechDoll:   { icon: Bot,         img: null },
  stormDancer:{ icon: Fan,         img: null },
  // 敵(第9章: 星降りの浮島)
  starSlime:  { icon: Star,        img: null },
  meteorBug:  { icon: Sparkles,    img: null },
  nightHerald:{ icon: Moon,        img: null },
  silentShade:{ icon: Ghost,       img: null },
  starCore:   { icon: Atom,        img: null },
  paperCrane: { icon: Origami,     img: null },
  judgmentScale:{ icon: Scale,     img: null },
  // 敵(第10章: 常夜の根)
  rootPuppet: { icon: TreePine,    img: null },
  abyssEye:   { icon: Eye,         img: null },
  nightMoth:  { icon: Cat,         img: null },
  shadeWalker:{ icon: Skull,       img: null },
  sealedEgg:  { icon: Egg,         img: null },
  sealedGaze: { icon: EyeClosed,   img: null },
  // ボス
  bossDeer:   { icon: Crown,       img: null },
  bossMycel:  { icon: Flower2,     img: null },
  bossGolem:  { icon: Mountain,    img: null },
  bossButterfly:{ icon: Flower,    img: null },
  bossCrystal:{ icon: Gem,         img: null },
  bossFlame:  { icon: Flame,       img: null },
  bossWolf:   { icon: Snowflake,   img: null },
  bossRoc:    { icon: Zap,         img: null },
  bossShadow: { icon: Moon,        img: null },
  bossRootKing:{ icon: Crown,      img: null },
};

/* ------------------------------------------------------------
   レアリティ定義(ドロップ重み: 高レアほど出にくい)
------------------------------------------------------------ */
const RARITIES = [
  { id: "common",    label: "コモン",     color: "#8fa596", glow: "none",                          weight: 54, mult: 1.0 },
  { id: "fine",      label: "良質",       color: "#7fc98a", glow: "0 0 10px rgba(127,201,138,.35)", weight: 26, mult: 1.3 },
  { id: "rare",      label: "レア",       color: "#6db3d9", glow: "0 0 12px rgba(109,179,217,.45)", weight: 13, mult: 1.7 },
  { id: "epic",      label: "エピック",   color: "#b48ce0", glow: "0 0 14px rgba(180,140,224,.55)", weight: 5.5, mult: 2.2 },
  { id: "legend",    label: "伝説",       color: "#e8b44a", glow: "0 0 18px rgba(232,180,74,.65)",  weight: 1.5, mult: 3.0 },
];
const rarityOf = (id) => RARITIES.find((r) => r.id === id);

/* ------------------------------------------------------------
   武器8種の特性
   dmgType: 斬 / 突 / 打 / 魔 / 音 — 敵の弱点・耐性と対応
------------------------------------------------------------ */
const WEAPON_TYPES = {
  dagger: {
    label: "短剣", asset: "dagger", dmgType: "斬", base: 5, cd: 0,
    desc: "素早い二連撃。会心が出やすい。",
    tags: ["2回攻撃", "会心25%"],
  },
  greatsword: {
    label: "大剣", asset: "greatsword", dmgType: "斬", base: 12, cd: 2,
    desc: "溜めの一撃。威力2.2倍、再使用まで2ターン。",
    tags: ["威力特大", "CT2"],
  },
  bow: {
    label: "弓", asset: "bow", dmgType: "突", base: 8, cd: 0,
    desc: "狙撃ののち、別の敵へ流れ矢(50%威力)。",
    tags: ["流れ矢", "命中安定"],
  },
  axe: {
    label: "斧", asset: "axe", dmgType: "打", base: 10, cd: 1,
    desc: "重い一撃で敵の守りを砕く(防御-2、累積)。",
    tags: ["防御破壊", "CT1"],
  },
  spear: {
    label: "槍", asset: "spear", dmgType: "突", base: 8, cd: 1,
    desc: "貫通。狙った敵の後ろにも70%威力。",
    tags: ["貫通", "CT1"],
  },
  book: {
    label: "本", asset: "book", dmgType: "魔", base: 7, cd: 2,
    desc: "詠唱一節。敵全体を魔で薙ぎ払う。",
    tags: ["全体攻撃", "CT2"],
  },
  staff: {
    label: "杖", asset: "staff", dmgType: "魔", base: 9, cd: 1,
    desc: "精霊の一撃(1.4倍)。撃つたび自分を少し癒す。",
    tags: ["自己回復", "CT1"],
  },
  instrument: {
    label: "楽器", asset: "instrument", dmgType: "音", base: 5, cd: 2,
    desc: "森に響く旋律。全体攻撃+敵の攻撃を2ターン弱める。",
    tags: ["全体+弱体", "CT2"],
  },
};

// 「遊び方」の武器一覧の表示順。属性(斬・打・突・魔・音)ごとにまとめつつ、
// 槍と斧は指定により打→突の順(斧が槍より先)にしてある。
const GUIDE_WEAPON_ORDER = ["dagger", "greatsword", "axe", "bow", "spear", "book", "staff", "instrument"];
// 「遊び方」に出す武器の仕様。WEAPON_TYPES.desc は雰囲気文(装備画面などで表示)なので、
// ここでは数値を省略せずに書いた説明文を別に持つ。倍率は attackWith() の実装と必ず一致させる。
const GUIDE_WEAPON_MECHANICS = {
  dagger: "2回連続で攻撃する。1撃ごとに25%の確率で会心が発生し、会心時は通常の1.8倍のダメージになる。",
  greatsword: "狙った敵1体に2.2倍のダメージ。再使用まで2ターンかかる。",
  axe: "狙った敵1体に1.6倍のダメージ。さらに相手の防御力を永続的に2下げる(重ねがけ可能)。再使用まで1ターンかかる。",
  bow: "狙った敵1体に等倍のダメージ。さらに、狙った敵以外の生存中の敵からランダムに1体選び、0.5倍のダメージ(流れ矢)。",
  spear: "狙った敵1体に1.1倍のダメージ。さらに、敵の並び順でその敵より後ろにいる生存中の敵のうち最初の1体に0.7倍のダメージ(貫通)。再使用まで1ターンかかる。",
  book: "生存している敵全員に等倍のダメージ。再使用まで2ターンかかる。",
  staff: "狙った敵1体に1.4倍のダメージ。同時に自分の最大HPの10%を回復する。再使用まで1ターンかかる。",
  instrument: "生存している敵全員に等倍のダメージ。さらに全員の攻撃力を2ターンの間下げる。再使用まで2ターンかかる。",
};

// 武器の銘 (レアリティ順に豪華に)
const WEAPON_NAMES = {
  dagger:     ["木漏れ日の短剣", "苔切りの小刀", "宵蛍の牙", "霧裂きミストリッパー", "月影・叢雨"],
  greatsword: ["樵の剛剣", "根断ちの大剣", "翠嵐の大剣", "巨樹喰らい", "森王剣ユグドレイヴ"],
  bow:        ["狩人の短弓", "枝弦の弓", "妖鳥落とし", "風詠みの長弓", "星射ちアルテミア"],
  axe:        ["山人の手斧", "幹割りの斧", "雷紋の戦斧", "大地砕き", "始まりの巨斧ガイア"],
  spear:      ["若枝の槍", "棘穿ちの槍", "蛇枝の長槍", "霧貫きロンギヌ", "世界樹の聖槍"],
  book:       ["苔むした草子", "森語りの書", "菌糸の魔導書", "妖精文法", "森羅の原典"],
  staff:      ["杣人の杖", "蕾の杖", "灯り苔の杖", "樹霊の錫杖", "大樹母神の杖"],
  instrument: ["木の実のオカリナ", "風鳴りの笛", "蛍籠のリラ", "夜啼きのヴィオラ", "森の交響ルシオール"],
};

/* ------------------------------------------------------------
   防具・消耗品
------------------------------------------------------------ */
const ARMOR_TYPES = {
  helm:  { label: "兜",   asset: "helm",  slot: "helm",  baseDef: 1, baseHp: 4 },
  armor: { label: "鎧",   asset: "armor", slot: "armor", baseDef: 2, baseHp: 8 },
  charm: { label: "護符", asset: "charm", slot: "charm", baseDef: 0, baseHp: 6 },
};
const ARMOR_NAMES = {
  helm:  ["木皮の鉢金", "堅果の兜", "甲蟲の兜", "翠玉の額冠", "森王の角冠"],
  armor: ["蔦編みの胴衣", "樹皮の鎧", "苔織りの外套", "妖精絹の羽衣", "世界樹の心鎧"],
  charm: ["どんぐりのお守り", "四つ葉の護符", "蛍石の首飾り", "月苔の勾玉", "森神の御印"],
};

const CONSUMABLES = {
  berrySmall: { label: "癒しの実",   asset: "berrySmall", desc: "HPを35%回復する。", kind: "heal",    power: 0.35 },
  berryBig:   { label: "生命の果実", asset: "berryBig",   desc: "HPを75%回復する。", kind: "heal",    power: 0.75 },
  antidote:   { label: "解毒草",     asset: "antidote",   desc: "毒を消し、HPを10%回復。", kind: "cure", power: 0.10 },
  spore:      { label: "力の胞子",   asset: "spore",      desc: "3ターンの間、攻撃力+40%。", kind: "buff", power: 0.4, turns: 3 },
  bomb:       { label: "森火の実",   asset: "bomb",       desc: "敵全体に固定ダメージ(深い階ほど強力)。", kind: "bomb", power: 25 },
  dew:        { label: "宝樹の雫",   asset: "dew",        desc: "金枝の精だけが落とす稀少な雫。継承枠を増やしたり、スキルツリーの結晶に変換できる。", kind: "orb" },
  mossHeart:  { label: "苔の心臓",   asset: "mossHeart",  desc: "使うと最大HPが永続+6。章の主だけが落とす。一度使うと二度と手に入らない。", kind: "metaHp" },
};
// 森火の実の固定ダメージ。以前は 20+floor*2 で、武器の成長率(floorごとに約+9%の乗算)に
// 対して伸びが緩やかすぎ、終盤ほど「使い所が無い」状態になっていた。素の威力と伸び率を
// 約2倍に引き上げ、袋の中でも実際の威力(bombPowerAt(g.floor))を表示して選びやすくする。
const bombPowerAt = (floor) => 30 + Math.round(floor * 4);

// 袋の並び替え「種類別」の既定順。武器は種類→レア度(高い順)、防具はスロット→レア度、
// 消耗品は定義順で揃える。同点は Array.prototype.sort の安定性により入手順のまま残る。
const RARITY_RANK = Object.fromEntries(RARITIES.map((r, i) => [r.id, i]));
const ARMOR_SLOT_ORDER = Object.keys(ARMOR_TYPES);
const CONSUMABLE_ORDER = Object.keys(CONSUMABLES);
function bagSortByType(a, b) {
  if (a.kind === "weapon" && b.kind === "weapon") {
    const ta = GUIDE_WEAPON_ORDER.indexOf(a.type), tb = GUIDE_WEAPON_ORDER.indexOf(b.type);
    if (ta !== tb) return ta - tb;
    const ra = RARITY_RANK[a.rarity] ?? 0, rb = RARITY_RANK[b.rarity] ?? 0;
    return rb - ra;
  }
  if (a.kind === "armor" && b.kind === "armor") {
    const sa = ARMOR_SLOT_ORDER.indexOf(a.slot), sb = ARMOR_SLOT_ORDER.indexOf(b.slot);
    if (sa !== sb) return sa - sb;
    const ra = RARITY_RANK[a.rarity] ?? 0, rb = RARITY_RANK[b.rarity] ?? 0;
    return rb - ra;
  }
  return CONSUMABLE_ORDER.indexOf(a.itemId) - CONSUMABLE_ORDER.indexOf(b.itemId);
}

/* ------------------------------------------------------------
   敵図鑑(全10章)
   weak: 弱点(1.6倍) / resist: 耐性(0.5倍)
   poison: 毒攻撃 / drain: 与ダメの半分を吸収
------------------------------------------------------------ */
const ENEMY_BOOK = {
  // 1章: 森
  slime:  { name: "森スライム",   asset: "slime",  hpK: 1.0, atkK: 0.9, def: 0, weak: ["斬", "魔"], resist: ["打"],  note: "斬撃で裂ける。打撃は吸収されがち。" },
  beetle: { name: "棘甲虫",       asset: "beetle", hpK: 0.9, atkK: 1.0, def: 3, weak: ["打"],       resist: ["突", "斬"], note: "固い殻。砕くしかない。" },
  wisp:   { name: "迷い火",       asset: "wisp",   hpK: 0.7, atkK: 1.2, def: 0, weak: ["魔", "音"], resist: ["斬", "打", "突"], note: "実体がなく、刃が通らない。" },
  raven:  { name: "妖鴉",         asset: "raven",  hpK: 0.8, atkK: 1.1, def: 1, weak: ["突"],       resist: ["斬"],  note: "羽ばたく的は射抜くが早い。" },
  treant: { name: "樹皮の番人",   asset: "treant", hpK: 1.6, atkK: 1.0, def: 4, weak: ["打", "魔"], resist: ["突"],  note: "斧と魔に弱い古木。" },
  shroom: { name: "眠り茸",       asset: "shroom", hpK: 1.0, atkK: 0.8, def: 1, weak: ["魔"],       resist: ["突"],  note: "胞子で毒を撒く。", poison: true },
  // 1章追加
  enchantedRabbit: { name: "惑いウサギ", asset: "enchantedRabbit", hpK: 0.65, atkK: 0.85, def: 0, weak: ["打", "魔"], resist: ["突"], poison: true, note: "無害そうに見えて毒の牙を持つ。油断は禁物。" },
  lostChild: { name: "迷い子の精", asset: "lostChild", hpK: 0.6, atkK: 1.1, def: 0, weak: ["魔", "音"], resist: ["斬", "打"], drain: true, note: "森に迷い込んだ幼き魂。触れると生気を奪われる。" },
  // 2章: 茸の湿原
  bogSlime:  { name: "毒沼スライム", asset: "bogSlime",  hpK: 1.1, atkK: 0.9, def: 0, weak: ["斬", "魔"], resist: ["打"], poison: true },
  sporeling: { name: "胞子小人",     asset: "sporeling", hpK: 0.8, atkK: 1.0, def: 1, weak: ["魔"],       resist: ["突"], poison: true },
  mudcrab:   { name: "泥蟹",         asset: "mudcrab",   hpK: 1.2, atkK: 0.9, def: 5, weak: ["打"],       resist: ["斬", "突"] },
  leech:     { name: "沼蛭",         asset: "leech",     hpK: 0.9, atkK: 1.0, def: 0, weak: ["斬"],       resist: ["打"], drain: true },
  bogFish:   { name: "沼鯰",         asset: "bogFish",   hpK: 1.0, atkK: 1.0, def: 2, weak: ["斬", "魔"], resist: ["打"], drain: true, note: "澱んだ水底に潜む。触れると生命力を吸われる。" },
  mutantFungus: { name: "変異菌体", asset: "mutantFungus", hpK: 0.9, atkK: 1.1, def: 1, weak: ["斬", "魔"], resist: ["突"], poison: true, note: "湿原の瘴気を浴びて変異した菌糸の塊。" },
  // 3章: 苔の遺跡
  statue:   { name: "石像兵",     asset: "statue",   hpK: 1.5, atkK: 1.0, def: 6, weak: ["打", "魔"], resist: ["斬", "突"] },
  skel:     { name: "骸骨兵",     asset: "skel",     hpK: 0.9, atkK: 1.1, def: 2, weak: ["打"],       resist: ["突"] },
  curseEye: { name: "呪いの眼",   asset: "curseEye", hpK: 0.8, atkK: 1.2, def: 0, weak: ["魔"],       resist: ["打"], drain: true },
  ruinBat:  { name: "廃廟の影猫", asset: "ruinBat",  hpK: 0.75, atkK: 1.1, def: 1, weak: ["音", "魔"], resist: ["斬"], drain: true, note: "暗闇に溶け込み生命力を奪う。音と魔法には弱い。" },
  ruinTurtle: { name: "遺跡の古亀", asset: "ruinTurtle", hpK: 1.6, atkK: 0.8, def: 8, weak: ["打"], resist: ["斬", "突", "魔"], note: "遺跡に棲む古代の亀。堅牢な甲羅は打撃でしか崩せない。" },
  ruinPyramid: { name: "石積の番人", asset: "ruinPyramid", hpK: 1.4, atkK: 1.0, def: 7, weak: ["打", "魔"], resist: ["斬", "突"], note: "遺跡の深部を守る石の像。重い打撃と魔法でのみ砕ける。" },
  // 4章: 花霞の谷
  bee:        { name: "花蜂",     asset: "bee",        hpK: 0.8, atkK: 1.2, def: 1, weak: ["突"],       resist: ["打"], poison: true },
  petalGuard: { name: "花守り",   asset: "petalGuard", hpK: 1.2, atkK: 0.9, def: 3, weak: ["斬"],       resist: ["魔"] },
  pixie:      { name: "蜜妖精",   asset: "pixie",      hpK: 0.7, atkK: 1.1, def: 0, weak: ["音", "魔"], resist: ["斬", "突"], drain: true },
  thornVine:  { name: "棘蔦",     asset: "thornVine",  hpK: 1.4, atkK: 1.0, def: 3, weak: ["斬", "打"], resist: ["突"] },
  roseThorn: { name: "棘薔薇霊", asset: "roseThorn", hpK: 1.0, atkK: 1.1, def: 2, weak: ["斬"], resist: ["魔"], poison: true, note: "美しい薔薇の精霊。棘に触れると毒を受ける。" },
  // 5章: 水晶洞
  crysTurtle: { name: "晶亀",     asset: "crysTurtle", hpK: 1.4, atkK: 0.9, def: 8, weak: ["打", "音"], resist: ["斬", "突"] },
  prism:      { name: "光屈の精", asset: "prism",      hpK: 0.9, atkK: 1.1, def: 2, weak: ["音"],       resist: ["魔", "斬"] },
  crysBug:    { name: "晶蟲",     asset: "crysBug",    hpK: 1.0, atkK: 1.0, def: 5, weak: ["打"],       resist: ["突"] },
  shardWisp:  { name: "晶霊",     asset: "shardWisp",  hpK: 0.8, atkK: 1.2, def: 0, weak: ["魔", "音"], resist: ["斬", "打", "突"] },
  crystalSnail: { name: "水晶蝸牛", asset: "crystalSnail", hpK: 1.4, atkK: 0.8, def: 11, weak: ["打", "音"], resist: ["斬", "突", "魔"], note: "水晶の殻を持つ蝸牛。防御は鉄壁だが打撃の振動が弱点。" },
  crystalDisc: { name: "水晶円盤", asset: "crystalDisc", hpK: 0.9, atkK: 1.2, def: 4, weak: ["音", "打"], resist: ["斬", "魔"], note: "高速回転する水晶の円盤。斬撃を弾き返すが音に弱い。" },
  // 6章: 焔の峠
  salamander: { name: "火蜥蜴",   asset: "salamander", hpK: 1.0, atkK: 1.2, def: 2, weak: ["突", "魔"], resist: ["斬"] },
  ashWraith:  { name: "灰亡霊",   asset: "ashWraith",  hpK: 0.9, atkK: 1.2, def: 0, weak: ["魔"],       resist: ["斬", "打", "突"], drain: true },
  magmaBug:   { name: "熔岩甲蟲", asset: "magmaBug",   hpK: 1.2, atkK: 1.0, def: 7, weak: ["打"],       resist: ["斬", "突"] },
  emberBird:  { name: "火の雛鳥", asset: "emberBird",  hpK: 0.8, atkK: 1.2, def: 1, weak: ["突"],       resist: ["打"] },
  fireShrimp: { name: "炎海老", asset: "fireShrimp", hpK: 0.8, atkK: 1.3, def: 3, weak: ["魔"], resist: ["突", "打"], note: "溶岩の流れに棲む海老。ハサミの熱が鎧を溶かす。" },
  // 7章: 氷樹の森
  blizzWolf:  { name: "吹雪の狼", asset: "blizzWolf",  hpK: 1.0, atkK: 1.3, def: 2, weak: ["音"],       resist: [] },
  iceSprite:  { name: "氷精",     asset: "iceSprite",  hpK: 0.8, atkK: 1.1, def: 1, weak: ["打", "魔"], resist: ["突", "斬"] },
  frostShroom:{ name: "凍り茸",   asset: "frostShroom",hpK: 1.1, atkK: 0.9, def: 2, weak: ["魔"],       resist: ["突"], poison: true },
  icicleTort: { name: "氷柱亀",   asset: "icicleTort", hpK: 1.5, atkK: 0.9, def: 9, weak: ["打"],       resist: ["斬", "突"] },
  snowHound:  { name: "北の猟犬", asset: "snowHound",  hpK: 0.9, atkK: 1.3, def: 2, weak: ["魔", "音"], resist: [], note: "氷雪に鍛えられた獰猛な狩猟犬。" },
  greedySpirit: { name: "強欲の精", asset: "greedySpirit", hpK: 2.0, atkK: 0.5, def: 15, weak: ["打"], resist: ["斬", "突", "魔", "音"], note: "財宝を詰め込んだ欲深き精霊。硬い外殻は打撃だけが崩せる。" },
  // 8章: 雷雲の尾根
  stormBird:  { name: "雷鳥",     asset: "stormBird",  hpK: 0.9, atkK: 1.3, def: 2, weak: ["突"],       resist: ["斬", "打"] },
  cloudEater: { name: "雲喰い",   asset: "cloudEater", hpK: 1.3, atkK: 1.0, def: 1, weak: ["魔", "音"], resist: ["斬", "打", "突"] },
  voltBug:    { name: "帯電蟲",   asset: "voltBug",    hpK: 1.0, atkK: 1.2, def: 6, weak: ["打"],       resist: ["突"] },
  galeSprite: { name: "嵐の精",   asset: "galeSprite", hpK: 0.8, atkK: 1.2, def: 0, weak: ["音"],       resist: ["斬"], drain: true },
  mechDoll:   { name: "霊械人形", asset: "mechDoll", hpK: 1.1, atkK: 1.2, def: 5, weak: ["魔", "音"], resist: ["斬", "突", "打"], note: "雷の精霊に魂を吹き込まれた機械人形。物理攻撃を弾く。" },
  stormDancer: { name: "嵐の舞姫", asset: "stormDancer", hpK: 0.7, atkK: 1.3, def: 0, weak: ["突"], resist: ["打"], drain: true, note: "嵐の中で踊り続ける精霊。攻撃をかわして生気を奪う。" },
  // 9章: 星降りの浮島
  starSlime:  { name: "星屑スライム", asset: "starSlime",  hpK: 1.1, atkK: 1.0, def: 1, weak: ["斬", "魔"], resist: ["打"] },
  meteorBug:  { name: "流星虫",       asset: "meteorBug",  hpK: 1.0, atkK: 1.2, def: 5, weak: ["打"],       resist: ["斬"] },
  nightHerald:{ name: "夜天の使い",   asset: "nightHerald",hpK: 1.2, atkK: 1.2, def: 2, weak: ["魔"],       resist: ["突", "打"], drain: true },
  silentShade:{ name: "無音の影",     asset: "silentShade",hpK: 0.9, atkK: 1.3, def: 0, weak: ["音"],       resist: ["斬", "突", "打"] },
  starCore:   { name: "星核の精",   asset: "starCore",   hpK: 0.9, atkK: 1.2, def: 2, weak: ["音"],       resist: ["斬", "魔"], note: "星の核から生まれた純粋なエネルギー体。" },
  paperCrane: { name: "折り鶴の精", asset: "paperCrane", hpK: 0.7, atkK: 1.1, def: 0, weak: ["打", "斬"], resist: ["魔"],       note: "星降る島に舞う折り紙の精霊。音もなく空を滑る。" },
  judgmentScale: { name: "裁きの天秤", asset: "judgmentScale", hpK: 1.2, atkK: 1.0, def: 2, weak: ["音"], resist: ["斬", "打"], drain: true, note: "宙に浮かぶ神秘の天秤。均衡を乱す者から生気を奪う。" },
  // 10章: 常夜の根
  rootPuppet: { name: "根の傀儡",   asset: "rootPuppet", hpK: 1.6, atkK: 1.1, def: 6, weak: ["打", "魔"], resist: ["突"] },
  abyssEye:   { name: "深淵の眼",   asset: "abyssEye",   hpK: 1.0, atkK: 1.3, def: 1, weak: ["魔"],       resist: ["打"], drain: true },
  nightMoth:  { name: "常夜蝶",     asset: "nightMoth",  hpK: 0.9, atkK: 1.2, def: 1, weak: ["突"],       resist: ["魔"], poison: true },
  shadeWalker:{ name: "影の旅人",   asset: "shadeWalker",hpK: 1.1, atkK: 1.4, def: 2, weak: ["音"],       resist: ["斬", "突", "打"] },
  sealedEgg:  { name: "封印の卵",   asset: "sealedEgg",  hpK: 0.8, atkK: 1.4, def: 3, weak: ["打"],       resist: ["突", "魔"], note: "常夜の底で蠢く謎の卵。何かが孵る前に倒さねば。" },
  sealedGaze: { name: "封じられた眼", asset: "sealedGaze", hpK: 1.0, atkK: 1.5, def: 2, weak: ["魔"],     resist: ["打", "突"], note: "常夜に眠る巨大な瞳。目覚めた瞬間、圧倒的な力が解き放たれる。" },
};
const RARE_ENEMY = {
  name: "金枝の精", asset: "goldSprite", note: "3ターンで消える。倒せば宝樹の雫を落とす。",
  weak: ["斬", "打", "突", "魔", "音"], resist: [],
};

/* ------------------------------------------------------------
   ステージ定義(第1〜10章) — 見た目・出現敵・ボス
   bg: 背景パレットと地形の種類 / particles: 漂う粒子
------------------------------------------------------------ */
const STAGES = [
  {
    name: "霧渡りの森", read: "きりわたりのもり", tate: "第一章",
    // 序盤で詰まないよう、短剣(斬)で倒せる敵を先頭に。甲虫・迷い火など斬耐性は後半に。
    enemies: ["slime", "enchantedRabbit", "raven", "shroom", "lostChild", "beetle", "wisp", "treant"],
    terrain: "trees",
    bg: { skyTop: [10, 20, 16], skyMid: [24, 44, 34], layers: ["rgba(18,30,23,.9)", "rgba(12,21,16,.95)", "rgba(7,13,10,1)"], moon: "rgba(238,230,204,.85)", mist: "157,180,166" },
    moonPhase: { phase: 0.22, waning: false },
    particles: { color: [240, 200, 110], mode: "float", density: 26 },
    boss: { id: "bossDeer", name: "森の主・苔冠の大鹿", asset: "bossDeer", weak: ["魔", "音"], resist: ["斬"], summons: ["slime", "wisp"], chargeLine: "大鹿は角を低く構えた……", bigLine: "渾身の角撃!!", summonLine: "大鹿が啼くと、森の眷属が湧き出した!" },
  },
  {
    name: "茸の湿原", read: "きのこのしつげん", tate: "第二章",
    enemies: ["bogSlime", "sporeling", "leech", "bogFish", "mutantFungus", "mudcrab", "shroom", "wisp"],
    terrain: "mounds",
    bg: { skyTop: [14, 16, 22], skyMid: [30, 42, 52], layers: ["rgba(28,38,48,.9)", "rgba(20,28,38,.95)", "rgba(10,15,22,1)"], moon: "rgba(180,220,214,.8)", mist: "140,180,190" },
    moonPhase: { phase: 0.38, waning: false },
    particles: { color: [150, 220, 190], mode: "rise", density: 30 },
    boss: { id: "bossMycel", name: "菌帝マザーマイセリア", asset: "bossMycel", weak: ["打", "斬"], resist: ["突"], poison: true, summons: ["sporeling", "bogSlime"], chargeLine: "菌帝が胞子を吸い込んでいく……", bigLine: "胞子の大嵐!!", summonLine: "地面から菌の子らが芽吹いた!" },
  },
  {
    name: "苔の遺跡", read: "こけのいせき", tate: "第三章",
    enemies: ["skel", "ruinBat", "statue", "ruinTurtle", "ruinPyramid", "curseEye", "wisp", "beetle"],
    terrain: "blocks",
    bg: { skyTop: [16, 17, 15], skyMid: [42, 44, 38], layers: ["rgba(40,42,36,.9)", "rgba(28,30,26,.95)", "rgba(14,15,13,1)"], moon: "rgba(230,225,200,.8)", mist: "170,172,150" },
    moonPhase: { phase: 0.50, waning: false },
    particles: { color: [210, 205, 170], mode: "float", density: 18 },
    boss: { id: "bossGolem", name: "遺跡の巨像アトラガル", asset: "bossGolem", weak: ["打", "魔"], resist: ["斬", "突"], summons: ["statue", "skel"], chargeLine: "巨像の拳が軋みを上げる……", bigLine: "崩落の一撃!!", summonLine: "壁面から石像兵が剥がれ落ちた!" },
  },
  {
    name: "花霞の谷", read: "はながすみのたに", tate: "第四章",
    enemies: ["bee", "petalGuard", "pixie", "roseThorn", "thornVine", "raven"],
    terrain: "hills",
    bg: { skyTop: [26, 14, 22], skyMid: [70, 36, 52], layers: ["rgba(58,30,44,.9)", "rgba(40,20,32,.95)", "rgba(20,10,16,1)"], moon: "rgba(255,214,214,.85)", mist: "220,170,190" },
    moonPhase: { phase: 0.67, waning: false },
    particles: { color: [245, 180, 200], mode: "fall", density: 34 },
    boss: { id: "bossButterfly", name: "花嵐の女王蝶ヴェスパリア", asset: "bossButterfly", weak: ["突"], resist: ["打"], poison: true, summons: ["bee", "pixie"], chargeLine: "女王蝶の翅が妖しく輝く……", bigLine: "鱗粉の嵐!!", summonLine: "花陰から蜂と妖精が舞い上がる!" },
  },
  {
    name: "水晶洞", read: "すいしょうどう", tate: "第五章",
    enemies: ["crysBug", "shardWisp", "crystalDisc", "prism", "crystalSnail", "crysTurtle", "curseEye"],
    terrain: "spires",
    bg: { skyTop: [8, 14, 26], skyMid: [22, 44, 74], layers: ["rgba(30,52,84,.85)", "rgba(20,36,62,.92)", "rgba(8,16,30,1)"], moon: "rgba(180,220,255,.8)", mist: "150,190,230" },
    moonPhase: { phase: 0.84, waning: false },
    particles: { color: [160, 210, 255], mode: "float", density: 24 },
    boss: { id: "bossCrystal", name: "晶洞竜クリスタヴェイン", asset: "bossCrystal", weak: ["打", "音"], resist: ["斬", "魔"], summons: ["prism", "crysBug"], chargeLine: "竜の鱗が光を溜めていく……", bigLine: "晶光の咆哮!!", summonLine: "砕けた鱗が晶蟲となって蠢く!" },
  },
  {
    name: "焔の峠", read: "ほむらのとうげ", tate: "第六章",
    enemies: ["emberBird", "salamander", "fireShrimp", "magmaBug", "ashWraith"],
    terrain: "peaks",
    bg: { skyTop: [24, 10, 8], skyMid: [70, 30, 18], layers: ["rgba(56,24,16,.9)", "rgba(38,16,10,.95)", "rgba(18,7,5,1)"], moon: "rgba(255,180,120,.8)", mist: "220,140,90" },
    moonPhase: { phase: 1.00, waning: false },
    particles: { color: [255, 150, 70], mode: "rise", density: 36 },
    boss: { id: "bossFlame", name: "焔尾の獣イグナロス", asset: "bossFlame", weak: ["突", "魔"], resist: ["音"], summons: ["emberBird", "salamander"], chargeLine: "獣の尾が焔を巻き上げる……", bigLine: "劫火の尾撃!!", summonLine: "火の粉が獣の仔らに変わる!" },
  },
  {
    name: "氷樹の森", read: "ひょうじゅのもり", tate: "第七章",
    enemies: ["snowHound", "greedySpirit", "iceSprite", "frostShroom", "blizzWolf", "icicleTort"],
    terrain: "trees",
    bg: { skyTop: [12, 18, 28], skyMid: [40, 58, 78], layers: ["rgba(70,92,116,.7)", "rgba(44,60,80,.85)", "rgba(18,26,38,1)"], moon: "rgba(220,235,255,.9)", mist: "200,220,240" },
    moonPhase: { phase: 0.80, waning: true },
    particles: { color: [230, 240, 255], mode: "fall", density: 44 },
    boss: { id: "bossWolf", name: "氷牙の古狼フェンヴァル", asset: "bossWolf", weak: ["打", "魔"], resist: ["突"], summons: ["blizzWolf", "iceSprite"], chargeLine: "古狼が白い息を吐き、身を沈めた……", bigLine: "凍てつく牙!!", summonLine: "吹雪の中から群れが応えた!" },
  },
  {
    name: "雷雲の尾根", read: "らいうんのおね", tate: "第八章",
    enemies: ["voltBug", "stormBird", "mechDoll", "stormDancer", "galeSprite", "cloudEater"],
    terrain: "ridge",
    bg: { skyTop: [14, 12, 24], skyMid: [36, 32, 58], layers: ["rgba(34,30,54,.9)", "rgba(24,21,40,.95)", "rgba(10,9,18,1)"], moon: "rgba(230,220,160,.7)", mist: "170,165,200", flash: true },
    moonPhase: { phase: 0.52, waning: true },
    particles: { color: [200, 195, 240], mode: "fall", density: 40, fast: true },
    boss: { id: "bossRoc", name: "雷駆のロック鳥トナリオン", asset: "bossRoc", weak: ["突"], resist: ["斬", "打"], summons: ["stormBird", "galeSprite"], chargeLine: "ロック鳥が雷雲を纏っていく……", bigLine: "落雷の急降下!!", summonLine: "翼の一振りで嵐の眷属が生まれた!" },
  },
  {
    name: "星降りの浮島", read: "ほしふりのうきしま", tate: "第九章",
    enemies: ["starSlime", "meteorBug", "starCore", "paperCrane", "nightHerald", "silentShade", "judgmentScale"],
    terrain: "islands",
    bg: { skyTop: [6, 8, 20], skyMid: [16, 20, 44], layers: ["rgba(24,28,56,.85)", "rgba(16,18,40,.92)", "rgba(6,7,18,1)"], moon: "rgba(200,210,255,.9)", mist: "150,160,220", stars: true },
    moonPhase: { phase: 0.33, waning: true },
    particles: { color: [220, 225, 255], mode: "float", density: 30 },
    boss: { id: "bossShadow", name: "星喰いノクスヴォア", asset: "bossShadow", weak: ["魔", "音"], resist: ["斬", "突", "打"], summons: ["silentShade", "nightHerald"], chargeLine: "星喰いが光を呑み込んでいく……", bigLine: "星喰らいの顎!!", summonLine: "影が千切れ、形を得た!" },
  },
  {
    name: "常夜の根", read: "とこよのね", tate: "終章",
    enemies: ["rootPuppet", "nightMoth", "sealedEgg", "sealedGaze", "abyssEye", "shadeWalker"],
    terrain: "roots",
    bg: { skyTop: [8, 6, 10], skyMid: [22, 16, 26], layers: ["rgba(26,20,30,.9)", "rgba(16,12,20,.95)", "rgba(6,5,9,1)"], moon: "rgba(232,180,74,.75)", mist: "160,140,120", stars: true },
    moonPhase: { phase: 0.10, waning: true },
    particles: { color: [232, 180, 74], mode: "float", density: 34 },
    boss: { id: "bossRootKing", name: "常夜の根王ユグドナハト", asset: "bossRootKing", weak: ["魔", "音"], resist: ["斬"], summons: ["rootPuppet", "shadeWalker"], chargeLine: "根王の千の根が大地を掴んだ……", bigLine: "世界根の槌!!", summonLine: "根の底から傀儡が這い上がる!", final: true },
  },
];
const stageOf = (floor) => Math.min(9, Math.floor((floor - 1) / 10));
const floorInStage = (floor) => ((floor - 1) % 10) + 1;
const floorLabel = (floor) => `${stageOf(floor) + 1}-${floorInStage(floor)}`;

/* ------------------------------------------------------------
   乱数・生成ユーティリティ
------------------------------------------------------------ */
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
let UID = 1;
const uid = () => `e${UID++}_${Date.now() % 100000}`;
// 同じ対象に複数のフロート数字が同時発生すると(杖の回復と余韻のライフスティールが重なる場合など)
// 全く同じ座標に重なって判読できなくなるため、横方向にずらして表示する。
const floatOffsetX = (i, n) => (n <= 1 ? 0 : (i - (n - 1) / 2) * 26);

// メタ依存の派生値
function weaponSlotsOf(m) {
  const s = m?.skills || {};
  return 3 + (s.weaponSlot4 ? 1 : 0) + (s.weaponSlot5 ? 1 : 0) + (s.weaponSlot6 ? 1 : 0);
}
function invCapOf(m, runBonus = 0) {
  const s = m?.skills || {};
  return 14 + (s.bagCapI ? 5 : 0) + (s.bagCapII ? 5 : 0) + (s.bagCapIII ? 6 : 0) + runBonus;
}
// 章ごとの金枝の精の基本出現率: 8〜12%は+1%刻み、以降+2%刻み
const RARE_CHANCE_BY_STAGE = [0.08, 0.09, 0.10, 0.11, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22];
function rareChanceOf(m, floor = 0) {
  const base = RARE_CHANCE_BY_STAGE[Math.min(stageOf(floor), RARE_CHANCE_BY_STAGE.length - 1)];
  return base + skillEffectTotal(m?.skills, "rareChancePct");
}

// レアリティ抽選 (luckBonus>0 でチェスト等の高レア補正)
function rollRarity(luckBonus = 0) {
  const ws = RARITIES.map((r, i) => r.weight * (1 + luckBonus * i * 0.9));
  const total = ws.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    roll -= ws[i];
    if (roll <= 0) return RARITIES[i];
  }
  return RARITIES[0];
}

function makeWeapon(floor, opts = {}) {
  const typeId = opts.type || pick(Object.keys(WEAPON_TYPES));
  const t = WEAPON_TYPES[typeId];
  const rar = opts.rarity ? rarityOf(opts.rarity) : rollRarity(opts.luck || 0);
  const idx = RARITIES.findIndex((r) => r.id === rar.id);
  const atk = Math.max(2, Math.round(t.base * rar.mult * (1 + floor * BALANCE.weaponGrowth) * rnd(0.92, 1.08)));
  return {
    id: uid(), kind: "weapon", type: typeId, name: WEAPON_NAMES[typeId][idx],
    rarity: rar.id, atk, asset: t.asset,
  };
}

function makeArmor(floor, opts = {}) {
  const slot = opts.slot || pick(Object.keys(ARMOR_TYPES));
  const a = ARMOR_TYPES[slot];
  const rar = opts.rarity ? rarityOf(opts.rarity) : rollRarity(opts.luck || 0);
  const idx = RARITIES.findIndex((r) => r.id === rar.id);
  const def = Math.round(a.baseDef * rar.mult + floor * BALANCE.armorDefGrowth);
  const hp = Math.round(a.baseHp * rar.mult * (1 + floor * BALANCE.armorHpGrowth));
  return {
    id: uid(), kind: "armor", slot, name: ARMOR_NAMES[slot][idx],
    rarity: rar.id, def, hp, asset: a.asset,
  };
}

// 回復アイテムの「進化」感: 序盤は解毒草(弱)中心 → 中盤は癒しの実(中) → 終盤は生命の果実(強)が増えていく。
// spore/bomb は回復ラインとは別枠として階層に関わらず一定の重みを保つ。
function consumableTableFor(floor) {
  const t = Math.min(1, Math.max(0, (floor - 1) / 99));
  return [
    ["antidote", Math.round(30 - 24 * t)],
    ["berrySmall", Math.round(30 - 10 * t)],
    ["berryBig", Math.round(4 + 34 * t)],
    ["spore", 16],
    ["bomb", 18],
  ];
}
function makeConsumable(idOverride, floor = 1) {
  let id = idOverride;
  if (!id) {
    const table = consumableTableFor(floor);
    const total = table.reduce((a, [, w]) => a + w, 0);
    let roll = Math.random() * total;
    for (const [cid, w] of table) { roll -= w; if (roll <= 0) { id = cid; break; } }
  }
  const c = CONSUMABLES[id];
  return { id: uid(), kind: "item", itemId: id, name: c.label, rarity: id === "dew" || id === "mossHeart" ? "legend" : "common", asset: c.asset };
}

// 敵の生成 (floor: 1〜100 の絶対階層)
// 章が進むほど、階層あたりの伸び自体が急になる(stageMult)。
// スキルツリーで底上げしないと後半の章で足踏みするような強さを狙っている。
function stageMultOf(floor) {
  return 1 + stageOf(floor) * BALANCE.enemyStageMult;
}
function makeEnemy(bookId, floor) {
  const b = ENEMY_BOOK[bookId];
  const sIdx = stageOf(floor);
  const stageMult = stageMultOf(floor);
  const hp = Math.round((BALANCE.enemyHpBase + floor * BALANCE.enemyHpPerFloor) * stageMult * b.hpK * rnd(0.9, 1.1));
  const atk = Math.round((BALANCE.enemyAtkBase + floor * BALANCE.enemyAtkPerFloor) * stageMult * b.atkK);
  return {
    id: uid(), bookId, name: b.name, asset: b.asset,
    hp, maxHp: hp, atk, def: b.def + Math.floor(floor / 12) + sIdx,
    weak: b.weak, resist: b.resist,
    poison: !!b.poison, drain: !!b.drain, atkDown: 0, rare: false, boss: false,
  };
}
function makeRareEnemy(floor) {
  const hp = Math.round(55 + floor * 10);
  return {
    id: uid(), bookId: "goldSprite", name: RARE_ENEMY.name, asset: RARE_ENEMY.asset,
    hp, maxHp: hp, atk: 2, def: 0, weak: RARE_ENEMY.weak, resist: [],
    rare: true, fleeIn: 3, atkDown: 0, boss: false,
  };
}
function makeBoss(floor) {
  const sIdx = stageOf(floor);
  const B = STAGES[sIdx].boss;
  const hp = Math.round((BALANCE.enemyHpBase + floor * BALANCE.enemyHpPerFloor) * (BALANCE.bossHpMult + sIdx * BALANCE.bossHpMultStep));
  const atk = Math.round((BALANCE.enemyAtkBase + floor * BALANCE.enemyAtkPerFloor) * (BALANCE.bossAtkMult + sIdx * BALANCE.bossAtkMultStep));
  return {
    id: uid(), bookId: B.id, name: B.name, asset: B.asset,
    hp, maxHp: hp, atk, def: Math.round(BALANCE.bossDefBase + sIdx * BALANCE.bossDefStep),
    weak: B.weak, resist: B.resist,
    rare: false, boss: true, atkDown: 0, charge: false,
    poison: !!B.poison, drain: false,
    summons: B.summons, chargeLine: B.chargeLine, bigLine: B.bigLine, summonLine: B.summonLine,
    final: !!B.final,
  };
}

// フロアごとの出現テーブル(章の進みに応じて敵種と数が増える)
// lastRareSeen: 直近で金枝の精を目撃したフロア番号(連続出現を防ぐ)
// 直近で金枝の精を見てから次に出現するまでの最小フロア数(章が進むと短縮)
const rareCooldownOf = (floor) => stageOf(floor) >= 7 ? 2 : stageOf(floor) >= 3 ? 3 : 5;
function enemiesForEncounter(floor, lastRareSeen = 0, rareChance = 0.08) {
  const stage = STAGES[stageOf(floor)];
  const fis = floorInStage(floor);
  // プールは最低3体から開始し、2フロアごとに1体解放。
  // ただし最終通常フロア(fis=9)ではそのステージの全敵を解放し、
  // fis=10(ボス戦)でしか届かない末尾の敵が図鑑に登録できなくなるのを防ぐ。
  const poolSize = fis >= 9 ? stage.enemies.length : Math.min(stage.enemies.length, 3 + Math.floor(fis / 2));
  const avail = stage.enemies.slice(0, poolSize);
  let count = fis <= 2 ? ri(1, 2) : fis <= 5 ? 2 : ri(2, 3);
  if (stageOf(floor) >= 3) count = Math.max(count, 2);
  // シャッフルして順番に取ることで同一フロアでの重複を減らす
  const shuffled = [...avail].sort(() => Math.random() - 0.5);
  const list = Array.from({ length: count }, (_, i) => makeEnemy(shuffled[i % shuffled.length], floor));
  if (floor - lastRareSeen >= rareCooldownOf(floor) && Math.random() < rareChance) {
    list.push(makeRareEnemy(floor));
  }
  return list;
}

/* ------------------------------------------------------------
   永続データ (window.storage / 失敗時はメモリ)
------------------------------------------------------------ */
const SAVE_KEY = "kiriwatari-forest-save";
const RUN_SAVE_KEY = "kiriwatari-run-save";
let memorySave = null;
const DEFAULT_META = { slots: 1, deaths: 0, bestFloor: 1, clears: 0, bonusHp: 0, inherited: [], checkpoint: 1, dewBank: 0, skills: {}, mossHeartStages: [], reviveUsedThisRun: false, eventDay: null, eventSeenMax: 0, eventReward: null, eventResetToken: null,
  // アイテム保護設定(捨てる操作をブロックする)。レアは既定でロック、回復は任意。
  protectHeals: false, protectRareItems: true,
  // 不具合(宝樹の雫を使っても報酬が付与されない)のお詫び配布(精の結晶 x5)。1アカウント1回のみ。
  compensationDewClaimed: false,
  // タイトルの「はじめの武器を選ぶ」を出すかどうかの判定用。meta.inherited は
  // ラン開始時に空になり、中断してタイトルへ戻っただけでも一時的に空になるため、
  // inherited の有無では「一度も武器を持ったことがないか」を正しく判定できない
  // (starterState は常に武器を1本持たせるので、ラン開始が一度でもあれば true になる)。
  everHadWeapon: false,
  // 袋の中身の並び順。"type" = 種類別(かつ同種内はレア度順、既定) / "acquired" = 入手順。
  bagSortMode: "type" };
const COMPENSATION_DEW_AMOUNT = 5;

/* ------------------------------------------------------------
   リワード広告(1日3回まで。宝珠2倍/復活のどちらかに使える共通回数)
------------------------------------------------------------ */
const REWARD_AD_DAILY_LIMIT = 3;
const rewardAdTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const rewardAdUsesLeft = (meta) => {
  const ra = meta?.rewardAd;
  if (!ra || ra.date !== rewardAdTodayKey()) return REWARD_AD_DAILY_LIMIT;
  return Math.max(0, REWARD_AD_DAILY_LIMIT - ra.count);
};
const consumeRewardAdUse = (meta) => {
  const today = rewardAdTodayKey();
  const ra = meta?.rewardAd;
  const count = ra && ra.date === today ? ra.count + 1 : 1;
  return { ...meta, rewardAd: { date: today, count } };
};

/* ------------------------------------------------------------
   宝樹の祠 — 1日1回のデイリーイベント(本編の攻略とは別枠で並行)
   時刻改ざんはソフト方式で防ぐ: これまで観測した最大時刻(eventSeenMax)より
   端末時計が前に戻ったら、本来の時刻に追いつくまで挑戦させない(ペナルティなし)。
------------------------------------------------------------ */
const EVENT_JST_OFFSET = 9 * 3600_000;        // 日付境界は JST 固定(端末TZに依存させない)
const EVENT_CLOCK_SKEW = 120_000;             // NTP 揺らぎの許容(2分)
const EVENT_TURNS = 3;                         // 金枝の古精が留まるターン数
// カテゴリ別ランキング70位突破記念 — 期間限定(JST。両端を含む)。次回開催時はこの2つを更新する。
const EVENT_START = "2026-09-19";
const EVENT_END   = "2026-09-24";
// このイベントを一旦無効化する(バナー・古精の出現とも止まる)。再開する時は true に戻し、
// 上の EVENT_START/EVENT_END を次回開催の期間に更新する。
const EVENT_ENABLED = false;
const eventJstDay = (t) => new Date(t + EVENT_JST_OFFSET).toISOString().slice(0, 10);
function eventStatus(meta) {
  const now = Date.now();
  const seenMax = meta?.eventSeenMax || 0;
  const clockBack = now < seenMax - EVENT_CLOCK_SKEW;
  const today = eventJstDay(now);
  const beforePeriod = today < EVENT_START;
  const afterPeriod = today > EVENT_END;
  const withinPeriod = EVENT_ENABLED && !beforePeriod && !afterPeriod;
  return {
    now, today, clockBack, withinPeriod, beforePeriod, afterPeriod,
    claimedToday: meta?.eventDay === today,
    available: withinPeriod && !clockBack && meta?.eventDay !== today,
  };
}
// 観測した最大時刻を前進させる(巻き戻し検知の基準を更新)
const touchEventSeen = (meta) => ({ ...meta, eventSeenMax: Math.max(meta?.eventSeenMax || 0, Date.now()) });
// 当日の挑戦を確定する
const commitEventDay = (meta) => ({ ...touchEventSeen(meta), eventDay: eventJstDay(Date.now()) });

/* ------------------------------------------------------------
   スキルツリー定義 (宝樹の雫=精の結晶で解放する永続スキル)
------------------------------------------------------------ */
// 以前のスキルツリー(再設計前)のコストのスナップショット。
// 再設計で存在しなくなった(または統合された)スキルを所持していた場合の結晶還元に使う。
const LEGACY_SKILL_COSTS = {
  weaponSlot4: 4, weaponSlot5: 7, weaponSlot6: 12,
  bladeBasics: 4, bladeMastery: 8, magicBasics: 4, magicMastery: 8,
  pierceBasics: 4, pierceMastery: 8, bluntBasics: 4, bluntMastery: 8,
  soundBasics: 4, soundMastery: 8, critUp: 6, powerSeal: 14,
  vitalityI: 4, vitalityII: 7, guardMastery: 5, regen: 9, lastStand: 8,
  bagCapI: 3, bagCapII: 6, goldSenseI: 4, goldSenseII: 6, goldSenseIII: 8, goldSenseIV: 10,
  startBonus: 3, startBonus2: 5,
};

// requires: 単一の前提スキルID。requiresAll: 複数の前提スキルIDをすべて満たす必要がある場合に使用(requiresより優先)。
// effect: { type, value, ... } — skillEffectTotal() で集計してゲームロジックに反映する(構造的なもの[武器枠/鞄容量/開始品]は個別に直接参照)。
const SKILL_TREE = [
  // 戦闘拡張 — 属性ごとに「心得」(地味な第一歩) → 分岐して「極意」(数値をさらに伸ばす)と「余韻」(攻撃吸収) →「奥義」(属性ごとの個性)
  { id: "weaponSlot4", name: "武器IV", category: "戦闘拡張", cost: 4, requires: null,
    desc: "武器スロット 3→4。属性の幅が広がる。" },
  { id: "weaponSlot5", name: "武器V", category: "戦闘拡張", cost: 7, requires: "weaponSlot4",
    desc: "武器スロット 4→5。" },
  { id: "weaponSlot6", name: "武器VI", category: "戦闘拡張", cost: 12, requires: "weaponSlot5",
    desc: "武器スロット 5→6 (最大)。" },

  { id: "bladeBasics", name: "斬の心得", category: "戦闘拡張", cost: 3, requires: null,
    desc: "斬属性武器のダメージ+5%。地道な鍛錬の第一歩。", effect: { type: "elementDmgPct", element: "斬", value: 0.05 } },
  { id: "bladeMastery", name: "斬の極意", category: "戦闘拡張", cost: 9, requires: "bladeBasics",
    desc: "斬属性武器のダメージ、さらに+15%(心得と合計+20%)。", effect: { type: "elementDmgPct", element: "斬", value: 0.15 } },
  { id: "bladeEdge", name: "斬の余韻", category: "戦闘拡張", cost: 6, requires: "bladeBasics",
    desc: "斬属性で与えたダメージの4%を自らの傷に還す。", effect: { type: "lifestealPct", element: "斬", value: 0.04 } },
  { id: "critUp", name: "会心の極意", category: "戦闘拡張", cost: 11, requires: "bladeMastery",
    desc: "短剣の会心率 25%→40%。斬の極みに至った証。", effect: { type: "critChancePct", value: 0.15 } },

  { id: "magicBasics", name: "魔の心得", category: "戦闘拡張", cost: 3, requires: null,
    desc: "魔属性武器のダメージ+5%。地道な鍛錬の第一歩。", effect: { type: "elementDmgPct", element: "魔", value: 0.05 } },
  { id: "magicMastery", name: "魔の極意", category: "戦闘拡張", cost: 9, requires: "magicBasics",
    desc: "魔属性武器のダメージ、さらに+15%(心得と合計+20%)。", effect: { type: "elementDmgPct", element: "魔", value: 0.15 } },
  { id: "magicEdge", name: "魔の余韻", category: "戦闘拡張", cost: 6, requires: "magicBasics",
    desc: "魔属性で与えたダメージの4%を自らの傷に還す。", effect: { type: "lifestealPct", element: "魔", value: 0.04 } },
  { id: "magicWard", name: "魔の守り", category: "戦闘拡張", cost: 11, requires: "magicMastery",
    desc: "体を魔力の膜が覆い、毒を受け付けなくなる。", effect: { type: "poisonImmune", value: 1 } },

  { id: "pierceBasics", name: "突の心得", category: "戦闘拡張", cost: 3, requires: null,
    desc: "突属性武器のダメージ+5%。地道な鍛錬の第一歩。", effect: { type: "elementDmgPct", element: "突", value: 0.05 } },
  { id: "pierceMastery", name: "突の極意", category: "戦闘拡張", cost: 9, requires: "pierceBasics",
    desc: "突属性武器のダメージ、さらに+15%(心得と合計+20%)。", effect: { type: "elementDmgPct", element: "突", value: 0.15 } },
  { id: "pierceEdge", name: "突の余韻", category: "戦闘拡張", cost: 6, requires: "pierceBasics",
    desc: "突属性で与えたダメージの4%を自らの傷に還す。", effect: { type: "lifestealPct", element: "突", value: 0.04 } },
  { id: "pierceDepth", name: "貫きの真髄", category: "戦闘拡張", cost: 11, requires: "pierceMastery",
    desc: "突属性武器のダメージ、さらに+7%(合計+27%)。矢と穂先がさらに冴える。", effect: { type: "elementDmgPct", element: "突", value: 0.07 } },

  { id: "bluntBasics", name: "打の心得", category: "戦闘拡張", cost: 3, requires: null,
    desc: "打属性武器のダメージ+5%。地道な鍛錬の第一歩。", effect: { type: "elementDmgPct", element: "打", value: 0.05 } },
  { id: "bluntMastery", name: "打の極意", category: "戦闘拡張", cost: 9, requires: "bluntBasics",
    desc: "打属性武器のダメージ、さらに+15%(心得と合計+20%)。", effect: { type: "elementDmgPct", element: "打", value: 0.15 } },
  { id: "bluntEdge", name: "打の余韻", category: "戦闘拡張", cost: 6, requires: "bluntBasics",
    desc: "打属性で与えたダメージの4%を自らの傷に還す。", effect: { type: "lifestealPct", element: "打", value: 0.04 } },
  { id: "bluntWeight", name: "破砕の真髄", category: "戦闘拡張", cost: 11, requires: "bluntMastery",
    desc: "打属性武器のダメージ、さらに+7%(合計+27%)。一撃がさらに深く食い込む。", effect: { type: "elementDmgPct", element: "打", value: 0.07 } },

  { id: "soundBasics", name: "音の心得", category: "戦闘拡張", cost: 3, requires: null,
    desc: "音属性武器のダメージ+5%。地道な鍛錬の第一歩。", effect: { type: "elementDmgPct", element: "音", value: 0.05 } },
  { id: "soundMastery", name: "音の極意", category: "戦闘拡張", cost: 9, requires: "soundBasics",
    desc: "音属性武器のダメージ、さらに+15%(心得と合計+20%)。", effect: { type: "elementDmgPct", element: "音", value: 0.15 } },
  { id: "soundEdge", name: "音の余韻", category: "戦闘拡張", cost: 6, requires: "soundBasics",
    desc: "音属性で与えたダメージの4%を自らの傷に還す。", effect: { type: "lifestealPct", element: "音", value: 0.04 } },
  { id: "soundEcho", name: "残響の真髄", category: "戦闘拡張", cost: 11, requires: "soundMastery",
    desc: "音属性武器のダメージ、さらに+7%(合計+27%)。旋律の残響がさらに響く。", effect: { type: "elementDmgPct", element: "音", value: 0.07 } },

  // 高レアスキル: 他のスキルより重いコスト(25)。
  { id: "soundDaze", name: "怯みの旋律", category: "戦闘拡張", cost: 25, requires: "soundEcho",
    desc: "楽器で下げた敵の攻撃力の低下が、2ターン→3ターン持続する。音の極みに至った者だけが奏でられる旋律。", effect: { type: "instrumentDebuffTurns", value: 1 } },
  { id: "powerSeal", name: "力の刻印", category: "戦闘拡張", cost: 20, requiresAll: ["bladeMastery", "magicMastery", "pierceMastery", "bluntMastery", "soundMastery"],
    desc: "全武器のダメージ+10%(属性の極意と重複可)。五属性すべての極意を極めた者だけが辿り着ける。", effect: { type: "allDmgPct", value: 0.10 } },

  // 生存 — 「種」(地味な一歩)から二方向に分かれ、最後は不屈へ収束する
  { id: "vitalitySeed", name: "生命の芽", category: "生存", cost: 3, requires: null,
    desc: "最大HPが永続+6。すべての生存術の起点。", effect: { type: "maxHp", value: 6 } },
  { id: "vitalityI", name: "生命の器I", category: "生存", cost: 6, requires: "vitalitySeed",
    desc: "最大HPがさらに永続+8(合計+14)。", effect: { type: "maxHp", value: 8 } },
  { id: "vitalityII", name: "生命の器II", category: "生存", cost: 10, requires: "vitalityI",
    desc: "最大HPがさらに永続+12(合計+26)。", effect: { type: "maxHp", value: 12 } },
  { id: "dodgeI", name: "健脚の心得", category: "生存", cost: 5, requires: "vitalitySeed",
    desc: "敵の攻撃を5%の確率で完全に避ける。", effect: { type: "dodgeChancePct", value: 0.05 } },
  { id: "dodgeII", name: "疾風の心得", category: "生存", cost: 9, requires: "dodgeI",
    desc: "回避率、さらに+7%(合計12%)。", effect: { type: "dodgeChancePct", value: 0.07 } },
  { id: "guardSeed", name: "守りの構え", category: "生存", cost: 3, requires: null,
    desc: "防具の防御力+6%。堅牢への第一歩。", effect: { type: "defPct", value: 0.06 } },
  { id: "guardMastery", name: "堅牢の心得", category: "生存", cost: 8, requires: "guardSeed",
    desc: "防具の防御力、さらに+12%(合計18%)。", effect: { type: "defPct", value: 0.12 } },
  { id: "regenSeed", name: "呼吸法", category: "生存", cost: 3, requires: null,
    desc: "戦闘開始時にHPを6%回復する。再生術の第一歩。", effect: { type: "battleStartHealPct", value: 0.06 } },
  { id: "regen", name: "再生の心得", category: "生存", cost: 10, requires: "regenSeed",
    desc: "戦闘開始時の回復、さらに+12%(合計18%)。", effect: { type: "battleStartHealPct", value: 0.12 } },
  { id: "lastStand", name: "不屈の心得", category: "生存", cost: 15, requiresAll: ["vitalityII", "guardMastery"],
    desc: "HPが最大値の25%以下のとき、被ダメージ-30%。生命と堅牢、両方を極めた者だけが辿り着ける。", effect: { type: "lowHpDmgReduction", value: 0.30, threshold: 0.25 } },

  // 探索
  { id: "bagCapI", name: "大きな鞄", category: "探索", cost: 3, requires: null,
    desc: "鞄の容量 14→19。" },
  { id: "bagCapII", name: "巨大な鞄", category: "探索", cost: 6, requires: "bagCapI",
    desc: "鞄の容量 19→24。" },
  { id: "bagCapIII", name: "果てなき鞄", category: "探索", cost: 25, requires: "bagCapII",
    desc: "鞄の容量 24→30。高レアスキル。" },
  { id: "goldSenseI", name: "精霊の気配I", category: "探索", cost: 4, requires: null,
    desc: "金枝の精の出現率+1%。", effect: { type: "rareChancePct", value: 0.01 } },
  { id: "goldSenseII", name: "精霊の気配II", category: "探索", cost: 6, requires: "goldSenseI",
    desc: "金枝の精の出現率、さらに+1%(合計+2%)。", effect: { type: "rareChancePct", value: 0.01 } },
  { id: "goldSenseIII", name: "精霊の気配III", category: "探索", cost: 8, requires: "goldSenseII",
    desc: "金枝の精の出現率、さらに+1%(合計+3%)。", effect: { type: "rareChancePct", value: 0.01 } },
  { id: "goldSenseIV", name: "精霊の気配IV", category: "探索", cost: 10, requires: "goldSenseIII",
    desc: "金枝の精の出現率、さらに+1%(合計+4%、最大)。", effect: { type: "rareChancePct", value: 0.01 } },
  { id: "luckyEyeI", name: "商人の目利き", category: "探索", cost: 5, requires: null,
    desc: "戦闘での武器・防具ドロップのレア度がわずかに上がる。", effect: { type: "dropLuck", value: 0.15 } },
  { id: "luckyEyeII", name: "掘り出し物", category: "探索", cost: 9, requires: "luckyEyeI",
    desc: "ドロップのレア度補正、さらに上昇(合計+0.35)。", effect: { type: "dropLuck", value: 0.20 } },

  // 転生 — 解毒草(弱)→ 癒しの実 → 力の胞子 → 生命の果実(強)と段階的に強化するスキルツリー
  { id: "startAntidote", name: "旅装の記憶I", category: "転生", cost: 2, requires: null,
    desc: "旅の始まりに解毒草が1つ追加される。" },
  { id: "startAntidote2", name: "旅装の記憶II", category: "転生", cost: 3, requires: "startAntidote",
    desc: "旅の始まりにさらに解毒草が1つ追加される。" },
  { id: "startBerryS", name: "旅装の記憶III", category: "転生", cost: 4, requires: "startAntidote",
    desc: "旅の始まりに癒しの実(HP35%回復)が1つ追加される。" },
  { id: "startBerryS2", name: "旅装の記憶IV", category: "転生", cost: 5, requires: "startBerryS",
    desc: "旅の始まりにさらに癒しの実が1つ追加される。" },
  { id: "fateMemory", name: "宿命の記憶I", category: "転生", cost: 5, requires: "startBerryS",
    desc: "旅の始まりに力の胞子が1つ追加される。" },
  { id: "fateMemory2", name: "宿命の記憶II", category: "転生", cost: 8, requires: "fateMemory",
    desc: "旅の始まりにさらに力の胞子が1つ追加される。" },
  { id: "startBerryB", name: "旅装の記憶V", category: "転生", cost: 9, requires: "fateMemory",
    desc: "旅の始まりに生命の果実が1つ追加される。" },
  { id: "startBerryB2", name: "旅装の記憶VI", category: "転生", cost: 12, requires: "startBerryB",
    desc: "旅の始まりにさらに生命の果実が1つ追加される。" },
];

// スキル効果の合計値を集計する(構造的な効果[武器枠/鞄容量/開始品]はここでは扱わない)。
function skillEffectTotal(skills, type, filter) {
  let sum = 0;
  for (const s of SKILL_TREE) {
    if (!skills?.[s.id] || !s.effect || s.effect.type !== type) continue;
    if (filter && !filter(s.effect)) continue;
    sum += s.effect.value || 0;
  }
  return sum;
}

// スキルツリー再設計に伴う互換性維持。新ツリーに存在しなくなったスキルを所持していた場合、
// 結晶で全額還元する(旧コストは LEGACY_SKILL_COSTS を参照)。一度きりしか実行しない。
const SKILLTREE_MIGRATION_VERSION = 3;
function migrateSkillTree(meta) {
  if ((meta.skillTreeGen || 1) >= SKILLTREE_MIGRATION_VERSION) return meta;
  const owned = Object.keys(meta.skills || {}).filter((id) => meta.skills[id]);
  const orphaned = owned.filter((id) => !SKILL_TREE.some((s) => s.id === id));
  if (orphaned.length === 0) return { ...meta, skillTreeGen: SKILLTREE_MIGRATION_VERSION };
  const refund = orphaned.reduce((sum, id) => sum + (LEGACY_SKILL_COSTS[id] || 5), 0);
  const newSkills = { ...meta.skills };
  orphaned.forEach((id) => { delete newSkills[id]; });
  return {
    ...meta,
    skills: newSkills,
    dewBank: (meta.dewBank || 0) + refund,
    skillTreeGen: SKILLTREE_MIGRATION_VERSION,
    skillRefundNotice: refund,
  };
}

// requires(単一)/requiresAll(複数)のどちらであっても前提条件を満たしているか判定する。
function skillPrereqsMet(skill, skills) {
  if (skill.requiresAll) return skill.requiresAll.every((id) => !!skills?.[id]);
  if (skill.requires) return !!skills?.[skill.requires];
  return true;
}

async function loadMeta() {
  let raw = null;
  try {
    const r = await window.storage.get(SAVE_KEY);
    if (r && r.value) { raw = r.value; return { ...DEFAULT_META, ...JSON.parse(r.value) }; }
  } catch (e) {
    // 壊れたセーブを無言で初期化して終わらせない。復旧の手がかりとして退避してから既定値へ。
    if (raw) { try { await window.storage.set(SAVE_KEY + ".corrupt_backup", raw); } catch {} }
  }
  return memorySave ? { ...memorySave } : { ...DEFAULT_META };
}
async function saveMeta(meta) {
  memorySave = { ...meta };
  try { await window.storage.set(SAVE_KEY, JSON.stringify(meta)); } catch (e) { /* メモリ保存で継続 */ }
}
async function loadRun() {
  try {
    const r = await window.storage.get(RUN_SAVE_KEY);
    if (r && r.value) return JSON.parse(r.value);
  } catch {}
  return null;
}
// rewardPhase/drops: ボス撃破直後など「未回収の確定ドロップ」がある場合に渡す。
// これが無いと、ドロップ確定〜プレイヤーが実際に拾うまでの間にタスキルされると、
// 一度きりの確定報酬(伝説武器・苔の心臓など)が二度と手に入らなくなる。
async function saveRun(floor, node, player, weapons, armor, inv, cds, lastRareSeen, orbBagBonus = 0, enemies = null, rewardPhase = null, drops = null) {
  try {
    const data = { floor, node: node || 0, player: { hp: player.hp, poison: player.poison || 0, atkUp: player.atkUp || 0, guard: false }, weapons, armor, inv, cds: cds || {}, lastRareSeen: lastRareSeen || 0, orbBagBonus: orbBagBonus || 0 };
    if (enemies && enemies.length > 0) data.enemies = enemies;
    // 全部拾い終えていても(=drops が空でも)rewardPhase は保持する。ここを外すと、
    // 「拾い終えたが『進む』はまだ押していない」タイミングでのタスキル再開時にボスが
    // 再生成されてしまう(倒したはずのボスと再戦させられる)。
    if (rewardPhase) { data.rewardPhase = rewardPhase; data.drops = drops || []; }
    await window.storage.set(RUN_SAVE_KEY, JSON.stringify(data));
  } catch {}
}
async function clearRun() {
  try { await window.storage.set(RUN_SAVE_KEY, ""); } catch {}
}
async function saveDeadRun(floor, weapons, armor, inv, orbBagBonus = 0, orbSlotBonus = 0) {
  try {
    const data = { phase: "dead", floor, weapons, armor, inv, orbBagBonus, orbSlotBonus };
    await window.storage.set(RUN_SAVE_KEY, JSON.stringify(data));
  } catch {}
}

/* ------------------------------------------------------------
   スタイル — 「霧渡りの森」
   墨緑の闇 × 蛍の灯 × 明朝の縦書き
------------------------------------------------------------ */
const CSS = `
/* アプリに同梱したフォント(WKURLSchemeHandler がバンドルから配信) */
@font-face {
  font-family: 'Shippori Mincho'; font-style: normal; font-weight: 500 800;
  font-display: swap; src: url('fonts/ShipporiMincho-Bold.ttf') format('truetype');
}
@font-face {
  font-family: 'Zen Kaku Gothic New'; font-style: normal; font-weight: 400;
  font-display: swap; src: url('fonts/ZenKakuGothicNew-Regular.ttf') format('truetype');
}
@font-face {
  font-family: 'Zen Kaku Gothic New'; font-style: normal; font-weight: 500;
  font-display: swap; src: url('fonts/ZenKakuGothicNew-Medium.ttf') format('truetype');
}
@font-face {
  font-family: 'Zen Kaku Gothic New'; font-style: normal; font-weight: 700;
  font-display: swap; src: url('fonts/ZenKakuGothicNew-Bold.ttf') format('truetype');
}

:root {
  --ink: #0a120e;
  --ink-2: #101b15;
  --ink-3: #17251d;
  --moss: #3e5c43;
  --moss-lt: #5f8265;
  --mist: #9db4a6;
  --paper: #e9e4d3;
  --paper-dim: #b9b7a5;
  --hotaru: #e8b44a;
  --hotaru-dim: rgba(232,180,74,.35);
  --danger: #d96a5a;
  --font-display: 'Shippori Mincho', 'Hiragino Mincho ProN', serif;
  --font-body: 'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
html, body { color: var(--paper); font-family: var(--font-body); }
.kw-root {
  height: 100vh; height: 100dvh; width: 100%;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-body);
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; align-items: center;
}
.kw-stage {
  position: relative; z-index: 2; width: 100%; max-width: 1020px;
  height: 100%; display: flex; flex-direction: column;
  /* Dynamic Island 分の余白を上部に確保 */
  padding: calc(14px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom));
  overflow: hidden;
}

/* --- 背景層 --- */
.kw-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.kw-bg svg, .kw-bg canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.kw-bg-preview { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.kw-bg-preview svg, .kw-bg-preview canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.kw-vignette { position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: radial-gradient(ellipse 90% 70% at 50% 42%, transparent 40%, rgba(4,8,6,.55) 100%); }

/* --- ヘッダ(章と階) --- */
.kw-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.kw-floor {
  font-family: var(--font-display); font-weight: 800; font-size: 30px; letter-spacing: .08em;
  color: var(--paper); line-height: 1;
}
.kw-floor small { font-size: 12px; color: var(--mist); font-weight: 500; display: block; margin-bottom: 4px; letter-spacing: .3em; }
.kw-progress { display: flex; gap: 6px; align-items: center; }
.kw-node { width: 9px; height: 9px; border-radius: 50%; border: 1px solid var(--moss-lt); opacity: .5; }
.kw-node.done { background: var(--hotaru); border-color: var(--hotaru); opacity: 1; box-shadow: 0 0 8px var(--hotaru-dim); }
.kw-node.now { border-color: var(--hotaru); opacity: 1; }

/* --- パネル共通 --- */
.kw-panel {
  background: linear-gradient(180deg, rgba(23,37,29,.92), rgba(16,27,21,.94));
  border: 1px solid rgba(157,180,166,.16);
  border-radius: 10px;
  backdrop-filter: blur(3px);
}

/* --- 敵エリア --- */
.kw-field { flex: 1 1 auto; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; display: flex; flex-direction: column; align-items: stretch; }
.kw-field-inner { margin: auto; width: 100%; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 18px; padding: 18px 8px 20px; }
.kw-field-panel { margin: auto; width: 100%; display: flex; flex-direction: column; align-items: center; padding: 18px 8px 20px; }
.kw-enemy {
  position: relative; width: 138px; padding: 16px 10px 12px; text-align: center;
  cursor: pointer; transition: transform .18s ease, box-shadow .18s ease;
  animation: kwFloat 4.2s ease-in-out infinite;
}
.kw-enemy:nth-child(2) { animation-delay: -1.4s; }
.kw-enemy:nth-child(3) { animation-delay: -2.8s; }
.kw-enemy.targetable:hover { transform: translateY(-5px); box-shadow: 0 0 0 1px var(--hotaru), 0 8px 26px rgba(0,0,0,.4); }
.kw-enemy.dead { opacity: 0; transform: scale(.7) translateY(10px); pointer-events: none; transition: all .5s ease; }
.kw-enemy .kw-eicon { display: inline-flex; padding: 14px; border-radius: 50%;
  background: radial-gradient(circle, rgba(94,130,101,.28), transparent 70%); margin-bottom: 6px; }
.kw-enemy .kw-ename { font-family: var(--font-display); font-size: 13px; font-weight: 700; letter-spacing: .06em; }
.kw-enemy.rare { box-shadow: 0 0 0 1px var(--hotaru), 0 0 24px var(--hotaru-dim); }
.kw-enemy.rare .kw-ename { color: var(--hotaru); }
.kw-enemy.boss { width: 200px; }
.kw-enemy.hit { animation: kwShake .32s ease; }
@keyframes kwFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes kwShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(5px); } }

.kw-hpbar { height: 5px; border-radius: 3px; background: rgba(0,0,0,.5); overflow: hidden; margin-top: 8px; }
.kw-hpbar i { display: block; height: 100%; background: linear-gradient(90deg, #6fae78, #a3cf9f); transition: width .35s ease; }
.kw-hpbar.boss i { background: linear-gradient(90deg, #c76a4f, var(--hotaru)); }
.kw-affin { display: flex; justify-content: center; gap: 4px; margin-top: 7px; flex-wrap: wrap; }
.kw-chip { font-size: 10px; padding: 1px 6px; border-radius: 3px; letter-spacing: .1em; }
.kw-chip.weak { color: var(--hotaru); border: 1px solid var(--hotaru-dim); }
.kw-chip.res { color: var(--paper-dim); border: 1px solid rgba(185,183,165,.25); }
.kw-chip.unknown { color: var(--mist); border: 1px dashed rgba(157,180,166,.3); }

/* --- ダメージ演出 --- */
.kw-float { position: absolute; left: 50%; top: 8%; transform: translateX(-50%);
  font-family: var(--font-display); font-weight: 800; pointer-events: none;
  animation: kwRise 1s ease forwards; white-space: nowrap; z-index: 5; text-shadow: 0 2px 8px rgba(0,0,0,.7); }
@keyframes kwRise { 0% { opacity: 0; transform: translate(-50%, 8px) scale(.8); }
  18% { opacity: 1; transform: translate(-50%, -4px) scale(1.12); }
  100% { opacity: 0; transform: translate(-50%, -46px) scale(1); } }

/* --- プレイヤーHUD --- */
.kw-hud { display: flex; align-items: center; gap: 14px; padding: 12px 16px; margin-bottom: 10px; flex-shrink: 0; min-height: 50px; }
.kw-hud .kw-me { font-family: var(--font-display); font-weight: 700; font-size: 14px; letter-spacing: .12em; }
.kw-mybar { flex: 1; height: 10px; border-radius: 5px; background: rgba(0,0,0,.5); overflow: hidden; }
.kw-mybar i { display: block; height: 100%; background: linear-gradient(90deg, var(--hotaru), #f3d489); transition: width .3s ease; box-shadow: 0 0 10px var(--hotaru-dim); }
.kw-hud .kw-num { font-family: var(--font-display); font-size: 15px; min-width: 84px; text-align: right; }
.kw-status { display: flex; gap: 6px; }
.kw-tag { font-size: 10px; padding: 2px 7px; border-radius: 3px; border: 1px solid; letter-spacing: .08em; }
.kw-tag.buff { color: var(--hotaru); border-color: var(--hotaru-dim); }
.kw-tag.bad { color: var(--danger); border-color: rgba(217,106,90,.4); }

/* --- 手札(武器) --- */
.kw-hand { display: flex; flex-direction: row; overflow-x: auto; overflow-y: visible; gap: 8px; flex-shrink: 0;
  scrollbar-width: none; -webkit-overflow-scrolling: touch; padding: 6px 4px 8px; margin: -6px -4px -8px; }
.kw-hand::-webkit-scrollbar { display: none; }
.kw-wcard { position: relative; padding: 16px 12px; text-align: left; cursor: pointer;
  flex: 1; min-width: 150px;
  transition: transform .15s ease, box-shadow .15s ease; color: var(--paper); font-family: var(--font-body); }
.kw-wcard:hover:not(:disabled) { transform: translateY(-3px); }
.kw-wcard:disabled { opacity: .38; cursor: default; }
.kw-wcard.selected { box-shadow: 0 0 0 1.5px var(--hotaru), 0 6px 20px rgba(0,0,0,.45); transform: translateY(-3px); }
.kw-wcard .kw-wname { font-family: var(--font-display); font-weight: 700; font-size: 13px; margin: 4px 0 2px; line-height: 1.3; }
.kw-wcard .kw-wmeta { font-size: 11px; color: var(--mist); display: flex; gap: 8px; align-items: center; }
.kw-wcard .kw-wcd { position: absolute; right: 8px; top: 8px; font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--paper-dim); }
.kw-typechip { font-size: 10px; padding: 0 5px; border-radius: 3px; background: rgba(94,130,101,.25); color: var(--mist); letter-spacing: .1em; }

/* --- ボタン --- */
.kw-btn { font-family: var(--font-body); font-weight: 700; letter-spacing: .14em; cursor: pointer;
  background: transparent; color: var(--paper); border: 1px solid rgba(233,228,211,.35);
  border-radius: 8px; padding: 8px 18px; font-size: 13px; white-space: nowrap; transition: all .18s ease; }
.kw-btn:hover { border-color: var(--hotaru); color: var(--hotaru); box-shadow: 0 0 14px var(--hotaru-dim); }
.kw-btn.primary { border-color: var(--hotaru); color: var(--ink); background: var(--hotaru); }
.kw-btn.primary:hover { background: #f3c86b; color: var(--ink); }
.kw-btn.ghost { border-color: rgba(157,180,166,.3); color: var(--mist); }
.kw-btn:disabled { opacity: .35; cursor: default; box-shadow: none; }

/* --- ログ --- */
.kw-log { margin-top: 10px; padding: 9px 14px; font-size: 12px; color: var(--paper-dim);
  height: 79px; flex-shrink: 0; overflow-y: auto; -webkit-overflow-scrolling: touch;
  display: flex; flex-direction: column; line-height: 1.7; box-sizing: border-box; }
.kw-log b { color: var(--hotaru); font-weight: 700; }
.kw-log .new { color: var(--paper); }
.kw-log::-webkit-scrollbar { width: 3px; }
.kw-log::-webkit-scrollbar-track { background: transparent; }
.kw-log::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 3px; }

/* --- サブバー(所持品など) --- 高さ固定でボタン位置がぶれないようにする */
.kw-subbar { display: flex; gap: 8px; margin-top: 10px; flex-wrap: nowrap; align-items: center;
  min-height: 44px; flex-shrink: 0; overflow: hidden; }
.kw-subbar .kw-hint { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* --- オーバーレイ画面 --- */
.kw-overlay { position: fixed; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center;
  background: rgba(6,10,8,.82); backdrop-filter: blur(4px); padding: 12px; animation: kwFade .4s ease; }
@keyframes kwFade { from { opacity: 0; } to { opacity: 1; } }
.kw-sheet { width: 100%; max-width: 660px; max-height: 84vh; overflow-y: auto; padding: 20px 18px 16px; }
.kw-sheet h2 { font-family: var(--font-display); font-weight: 800; font-size: 20px; letter-spacing: .18em; margin-bottom: 4px; }
.kw-sheet .kw-sub { color: var(--mist); font-size: 12px; margin-bottom: 12px; line-height: 1.7; }
.kw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 8px; }
.kw-cell { padding: 10px; cursor: pointer; text-align: left; position: relative; color: var(--paper);
  font-family: var(--font-body); width: 100%; transition: box-shadow .15s ease; }
.kw-cell .kw-cname { font-family: var(--font-display); font-size: 12.5px; font-weight: 700; margin: 4px 0 2px; line-height: 1.35; }
.kw-cell .kw-cmeta { font-size: 10.5px; color: var(--mist); line-height: 1.5; }
.kw-cell.picked { box-shadow: 0 0 0 1.5px var(--hotaru); }
.kw-cell.equipped-mark::after { content: "装備中"; position: absolute; top: 7px; right: 8px; font-size: 9px; color: var(--hotaru); letter-spacing: .1em; }
.kw-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; flex-wrap: wrap; }
/* スクロールの最後まで届かないと出てこないのを防ぐ: 主要な進行ボタンは画面下端に
   固定表示する。中身が短ければ通常通りの位置のまま(sticky は必要な時だけ効く)。 */
.kw-actions.sticky { position: sticky; bottom: 0; z-index: 3;
  background: linear-gradient(180deg, rgba(16,27,21,0) 0, rgba(16,27,21,.98) 14px, rgba(16,27,21,.98) 100%);
  padding: 18px 4px; margin: 10px 0 0; }

/* --- タイトル --- */
.kw-title { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 18px; text-align: center;
  padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom));
  overflow-y: auto; }
.kw-title h1 { font-family: var(--font-display); font-weight: 800; font-size: clamp(40px, 8vw, 74px);
  letter-spacing: .3em; text-indent: .3em; line-height: 1.25;
  text-shadow: 0 0 40px rgba(232,180,74,.25); }
.kw-title .kw-tsub { color: var(--mist); letter-spacing: .5em; text-indent: .5em; font-size: 13px; }
.kw-title .kw-tmeta { color: var(--paper-dim); font-size: 12px; line-height: 2; }
.kw-tate { writing-mode: vertical-rl; font-family: var(--font-display); color: var(--mist);
  font-size: 13px; letter-spacing: .4em; line-height: 2.4; opacity: .85; }

/* --- レア色ユーティリティは inline style で付与 --- */
.kw-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(157,180,166,.3), transparent); margin: 14px 0; }

/* --- 稲光(第8章) --- */
.kw-flash { opacity: 0; animation: kwFlash 7s infinite; }
@keyframes kwFlash { 0%, 90.5%, 93.5%, 100% { opacity: 0; } 91%, 91.6% { opacity: .16; } 92.4%, 92.8% { opacity: .08; } }

/* --- 低HP警告(点滅させず、赤の静止表示で危険を示す) --- */
.kw-mybar.low i { background: linear-gradient(90deg, #d96a5a, #f09a8a); box-shadow: 0 0 10px rgba(217,106,90,.45); }

/* --- 弱点をつける敵のハイライト --- */
.kw-enemy.goodTarget { box-shadow: 0 0 0 1.5px var(--hotaru), 0 0 22px var(--hotaru-dim); }
.kw-enemy.goodTarget::before { content: "弱点をつける!"; position: absolute; top: -9px; left: 50%; transform: translateX(-50%);
  font-size: 9.5px; color: var(--ink); background: var(--hotaru); padding: 1px 8px; border-radius: 3px; letter-spacing: .1em; white-space: nowrap; }

/* --- 未回収確認などの最前面モーダル --- */
.kw-overlay.top { z-index: 50; }
.kw-notice { font-size: 11.5px; color: var(--danger); border: 1px solid rgba(217,106,90,.4); border-radius: 6px; padding: 7px 12px; margin-top: 10px; line-height: 1.7; }
.kw-hint-diff { font-size: 10px; margin-top: 3px; letter-spacing: .05em; }

/* --- 初回チュートリアルの吹き出し --- */
.kw-coach { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 40;
  max-width: 520px; width: calc(100% - 32px); padding: 14px 18px; animation: kwFade .4s ease; }
.kw-coach h4 { font-family: var(--font-display); font-size: 13px; letter-spacing: .12em; color: var(--hotaru); margin-bottom: 6px; }
.kw-coach p { font-size: 12px; color: var(--paper-dim); line-height: 1.8; }
.kw-coach .kw-actions { margin-top: 10px; }

/* --- エンディング --- */
.kw-credits { max-height: 46vh; overflow: hidden; position: relative; margin: 14px 0; }
.kw-credits-inner { animation: kwScroll 46s linear forwards; line-height: 2.6; font-size: 13px; color: var(--paper-dim); }
.kw-credits-inner h3 { font-family: var(--font-display); color: var(--paper); letter-spacing: .3em; margin: 26px 0 8px; font-weight: 700; }
@keyframes kwScroll { from { transform: translateY(46vh); } to { transform: translateY(-100%); } }

@media (max-width: 640px) {
  .kw-floor { font-size: 24px; }
  .kw-enemy { width: 116px; }
  .kw-enemy.boss { width: 170px; }
  .kw-hand { grid-template-columns: repeat(2, 1fr); }
  .kw-tate { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .kw-enemy { animation: none; }
}

/* --- 音量スライダー --- */
.kw-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer;
  background: linear-gradient(to right,
    var(--hotaru) 0%, var(--hotaru) var(--vol, 70%),
    rgba(157,180,166,.2) var(--vol, 70%), rgba(157,180,166,.2) 100%);
}
.kw-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--hotaru); cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,.5);
}

/* --- 図鑑(Bestiary) --- */
.kw-bestiary-tabs { display: flex; gap: 5px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
.kw-bestiary-tabs::-webkit-scrollbar { display: none; }
.kw-bestiary-tab { flex: 0 0 auto; padding: 4px 10px; font-size: 10px; letter-spacing: .1em;
  border: 1px solid rgba(157,180,166,.22); border-radius: 4px; cursor: pointer;
  background: transparent; color: var(--mist); }
.kw-bestiary-tab.active { border-color: var(--hotaru); color: var(--hotaru); background: rgba(232,180,74,.07); }
.kw-bestiary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; padding: 4px 0; }
.kw-bestiary-cell { display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 8px 4px; border-radius: 8px; border: 1px solid transparent; transition: border-color .15s, background .15s; }
.kw-bestiary-cell.seen { cursor: pointer; }
.kw-bestiary-cell.seen:hover { border-color: rgba(157,180,166,.28); background: rgba(157,180,166,.06); }
.kw-bestiary-cell.unseen { opacity: 0.3; cursor: default; }
.kw-bestiary-cell-icon { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle, rgba(94,130,101,.25), transparent 70%); }
.kw-bestiary-cell-icon.boss { background: radial-gradient(circle, rgba(232,180,74,.25), transparent 70%); }
.kw-bestiary-cell-label { font-size: 9px; color: var(--mist); text-align: center;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; max-width: 56px; }
.kw-bestiary-boss-sep { font-size: 9px; letter-spacing: .3em; color: var(--hotaru); opacity: .7;
  text-align: center; margin: 12px 0 8px; }
/* 詳細ポップアップ */
.kw-bestiary-detail-bg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(6,11,8,.82); z-index: 20; border-radius: inherit; }
.kw-bestiary-detail-card { background: linear-gradient(180deg, rgb(28,45,34), rgb(19,32,24)); border: 1px solid rgba(157,180,166,.3); border-radius: 10px;
  padding: 18px 20px; max-width: 260px; width: 88%; }
/* 図鑑 章カード */
.kw-bestiary-ch-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.kw-bestiary-ch-card { position: relative; overflow: hidden; height: 88px; border-radius: 8px;
  border: 1px solid rgba(157,180,166,.18); cursor: pointer; text-align: left; padding: 0;
  background: none; transition: border-color .15s; }
.kw-bestiary-ch-card:hover { border-color: rgba(157,180,166,.4); }
.kw-bestiary-ch-info { position: absolute; inset: 0; padding: 10px 12px; display: flex; flex-direction: column; justify-content: flex-end; }
/* ローディング */
@keyframes kw-dot-fade { 0%,80%,100% { opacity: .2; transform: scale(.8); } 40% { opacity: 1; transform: scale(1); } }
.kw-loading-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--hotaru); display: inline-block; }
`;

/* ------------------------------------------------------------
   背景 — 章ごとに地形・配色・粒子が変わる
   (粒子: float=蛍 / rise=火の粉・胞子 / fall=雪・花びら・雨)
------------------------------------------------------------ */
function Particles({ color = [240, 200, 110], mode = "float", density = 26, fast = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    let w, h, raf;
    const fit = () => { w = cvs.width = window.innerWidth; h = cvs.height = window.innerHeight; };
    fit(); window.addEventListener("resize", fit);
    const [cr, cg, cb] = color;
    const ps = Array.from({ length: density }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: rnd(0.8, 2.2), a: Math.random() * Math.PI * 2, v: rnd(0.12, 0.4),
      tw: rnd(0.004, 0.012), ph: Math.random() * Math.PI * 2, sway: rnd(0.3, 1),
    }));
    let t = 0;
    const step = () => {
      t += 1; ctx.clearRect(0, 0, w, h);
      for (const f of ps) {
        if (mode === "float") {
          f.a += rnd(-0.06, 0.06);
          f.x += Math.cos(f.a) * f.v; f.y += Math.sin(f.a) * f.v - 0.05;
        } else if (mode === "rise") {
          f.y -= f.v * 2.4; f.x += Math.sin(t * 0.01 + f.ph) * 0.4;
        } else { // fall
          f.y += f.v * (fast ? 7 : 2.2); f.x += Math.sin(t * 0.008 + f.ph) * f.sway * (fast ? 0.2 : 0.8);
        }
        if (f.x < -10) f.x = w + 10; if (f.x > w + 10) f.x = -10;
        if (f.y < -12) f.y = h + 10; if (f.y > h + 12) f.y = -10;
        const glow = mode === "fall" ? 0.8 : 0.35 + 0.65 * Math.abs(Math.sin(t * f.tw + f.ph));
        const rad = mode === "fall" ? f.r * 3 : f.r * 7;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${0.85 * glow})`);
        g.addColorStop(0.4, `rgba(${cr},${cg},${cb},${0.25 * glow})`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, rad, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", fit); };
  }, [color[0], color[1], color[2], mode, density, fast]);
  return <canvas ref={ref} aria-hidden="true" />;
}

// seed付き乱数(毎回同じ地形を描く)
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// 地形シルエット生成: mode ごとに輪郭が変わる
function terrainPath(mode, seed, baseY, amp, count) {
  const rand = seededRand(seed);
  const w = 1200;
  if (mode === "roots") {
    // 天井から垂れ下がる根
    let d = `M 0 -40`;
    for (let i = 0; i <= count; i++) {
      const x = (w / count) * i;
      const len = amp * (0.5 + rand() * 0.5);
      const half = 10 + rand() * 22;
      d += ` L ${x - half} ${baseY - amp} L ${x} ${baseY - amp + len} L ${x + half} ${baseY - amp}`;
    }
    d += ` L ${w} -40 Z`;
    return d;
  }
  let d = `M 0 ${baseY + 40}`;
  for (let i = 0; i <= count; i++) {
    const x = (w / count) * i;
    if (mode === "trees") {
      const h = amp * (0.55 + rand() * 0.45);
      const half = 14 + rand() * 26;
      d += ` L ${x - half} ${baseY} L ${x} ${baseY - h} L ${x + half} ${baseY}`;
    } else if (mode === "spires") {
      const h = amp * (0.6 + rand() * 0.55);
      const half = 8 + rand() * 14;
      d += ` L ${x - half} ${baseY} L ${x} ${baseY - h} L ${x + half} ${baseY}`;
    } else if (mode === "mounds") {
      const h = amp * (0.35 + rand() * 0.4);
      const half = 40 + rand() * 50;
      d += ` L ${x - half} ${baseY} Q ${x} ${baseY - h * 2} ${x + half} ${baseY}`;
    } else if (mode === "hills") {
      const h = amp * (0.25 + rand() * 0.3);
      d += ` Q ${x + w / count / 2} ${baseY - h * 2} ${x + w / count} ${baseY - (rand() - 0.5) * 30}`;
    } else if (mode === "blocks") {
      const h = amp * (0.3 + rand() * 0.6);
      const bw = 30 + rand() * 40;
      d += ` L ${x} ${baseY} L ${x} ${baseY - h} L ${x + bw} ${baseY - h} L ${x + bw} ${baseY}`;
    } else if (mode === "peaks" || mode === "ridge") {
      const h = amp * (mode === "peaks" ? 0.6 + rand() * 0.5 : 0.3 + rand() * 0.6);
      d += ` L ${x + w / count / 2} ${baseY - h} L ${x + w / count} ${baseY - rand() * amp * 0.2}`;
    }
  }
  d += ` L ${w} ${baseY + 40} Z`;
  return d;
}

// 月の満ち欠けを SVG clipPath パスとして返す。phase: 0=新月 〜 1=満月, waning: 欠ける方向
function moonPhasePath(cx, cy, r, phase, waning) {
  if (phase >= 0.99) return null; // 満月はクリップ不要
  if (phase <= 0.01) return `M ${cx} ${cy} Z`;
  const terminatorRx = r * Math.abs(Math.cos(Math.PI * phase));
  const isGibbous = phase > 0.5;
  const top = [cx, cy - r], bottom = [cx, cy + r];
  const limbSweep = waning ? 0 : 1;
  const termSweep = waning ? (isGibbous ? 0 : 1) : (isGibbous ? 1 : 0);
  return [`M ${top[0]} ${top[1]}`, `A ${r} ${r} 0 0 ${limbSweep} ${bottom[0]} ${bottom[1]}`, `A ${terminatorRx} ${r} 0 0 ${termSweep} ${top[0]} ${top[1]}`, `Z`].join(" ");
}

function StageBackdrop({ floor = 1, preview = false }) {
  const sIdx = stageOf(floor);
  const st = STAGES[sIdx];
  const depth = (floorInStage(floor) - 1) / 9; // 章内で霧が深まる
  const seedBase = (sIdx + 1) * 100 + Math.floor((floor - 1) / 10);

  const layers = useMemo(() => {
    const mode = st.terrain;
    if (mode === "islands") {
      return { islands: true, paths: [terrainPath("hills", seedBase + 53, 700, 160, 6)] };
    }
    if (mode === "roots") {
      return {
        roots: terrainPath("roots", seedBase + 7, 240, 240, 14),
        paths: [terrainPath("spires", seedBase + 31, 620, 220, 12), terrainPath("mounds", seedBase + 53, 700, 160, 8)],
      };
    }
    const counts = mode === "peaks" ? [6, 4, 3] : mode === "blocks" ? [12, 9, 7] : [16, 12, 9];
    return {
      paths: [
        terrainPath(mode, seedBase + 7, 470, 240, counts[0]),
        terrainPath(mode, seedBase + 31, 540, 300, counts[1]),
        terrainPath(mode, seedBase + 53, 620, 380, counts[2]),
      ],
    };
  }, [st.terrain, seedBase]);

  const stars = useMemo(() => {
    if (!st.bg.stars) return [];
    const rand = seededRand(seedBase + 99);
    return Array.from({ length: 70 }, () => ({ x: rand() * 1200, y: rand() * 420, r: 0.5 + rand() * 1.3, o: 0.3 + rand() * 0.6 }));
  }, [st.bg.stars, seedBase]);

  const isl = useMemo(() => {
    if (st.terrain !== "islands") return [];
    const rand = seededRand(seedBase + 11);
    return Array.from({ length: 4 }, (_, i) => ({
      x: 150 + rand() * 900, y: 300 + i * 90 + rand() * 60, rx: 90 + rand() * 130, ry: 18 + rand() * 14,
    }));
  }, [st.terrain, seedBase]);

  const c = (arr, dim) => `rgb(${Math.max(0, arr[0] - dim)}, ${Math.max(0, arr[1] - dim)}, ${Math.max(0, arr[2] - dim)})`;
  const dim = Math.round(depth * 6);

  const moonInfo = st.moonPhase || { phase: 1.0, waning: false };
  const moonClipPath = moonPhasePath(700, 120, 46, moonInfo.phase, moonInfo.waning);
  const skyId = `kwSky${sIdx}`, moonGradId = `kwMoon${sIdx}`, mistId = `kwMist${sIdx}`, moonClipId = `kwMoonClip${sIdx}`;

  return (
    <div className={preview ? "kw-bg-preview" : "kw-bg"} aria-hidden="true">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c(st.bg.skyTop, dim)} />
            <stop offset="0.55" stopColor={c(st.bg.skyMid, dim * 2)} />
            <stop offset="1" stopColor="#050806" />
          </linearGradient>
          <radialGradient id={moonGradId} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={st.bg.moon} />
            <stop offset="0.35" stopColor={st.bg.moon.replace(/[\d.]+\)$/, "0.25)")} />
            <stop offset="1" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id={mistId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={`rgba(${st.bg.mist},0)`} />
            <stop offset="0.5" stopColor={`rgba(${st.bg.mist},${0.10 + depth * 0.1})`} />
            <stop offset="1" stopColor={`rgba(${st.bg.mist},0)`} />
          </linearGradient>
          {moonClipPath && <clipPath id={moonClipId}><path d={moonClipPath} /></clipPath>}
        </defs>
        <rect width="1200" height="800" fill={`url(#${skyId})`} />
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={`rgba(230,235,255,${s.o})`} />)}
        <circle cx="700" cy="120" r="150" fill={`url(#${moonGradId})`} />
        <circle cx="700" cy="120" r="46" fill={st.bg.moon} clipPath={moonClipPath ? `url(#${moonClipId})` : undefined} />
        <polygon points="640,120 760,120 910,800 460,800" fill="rgba(235,226,196,0.045)" />
        {layers.roots && <path d={layers.roots} fill={st.bg.layers[1]} />}
        {isl.map((o, i) => (
          <g key={i}>
            <ellipse cx={o.x} cy={o.y} rx={o.rx} ry={o.ry} fill={st.bg.layers[i % 2]} />
            <path d={`M ${o.x - o.rx * 0.6} ${o.y + 4} L ${o.x} ${o.y + o.ry * 3.2} L ${o.x + o.rx * 0.6} ${o.y + 4} Z`} fill={st.bg.layers[2]} />
          </g>
        ))}
        {layers.paths.map((d, i) => <path key={i} d={d} fill={st.bg.layers[Math.min(i, st.bg.layers.length - 1)]} />)}
        <ellipse cx="600" cy="600" rx="700" ry="60" fill={`url(#${mistId})`}>
          <animate attributeName="cx" values="500;700;500" dur="26s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="400" cy="700" rx="620" ry="52" fill={`url(#${mistId})`}>
          <animate attributeName="cx" values="700;380;700" dur="34s" repeatCount="indefinite" />
        </ellipse>
        {st.bg.flash && <rect className="kw-flash" width="1200" height="800" fill="rgba(230,225,255,1)" />}
      </svg>
      {!preview && <Particles color={st.particles.color} mode={st.particles.mode}
        density={st.particles.density + Math.round(depth * 12)} fast={st.particles.fast} />}
    </div>
  );
}
/* ------------------------------------------------------------
   小物コンポーネント
------------------------------------------------------------ */
// ASSETSのimgがあれば画像、なければアイコンを描く
function AssetIcon({ assetId, size = 24, color, style }) {
  const a = ASSETS[assetId];
  if (a && a.img) {
    return <img src={a.img} alt="" width={size} height={size}
      style={{ objectFit: "contain", display: "block", ...style }} />;
  }
  const I = (a && a.icon) || Package;
  return <I size={size} color={color} strokeWidth={1.6} style={style} />;
}

function RarityName({ item, small }) {
  const r = rarityOf(item.rarity) || RARITIES[0];
  return (
    <span style={{ color: r.color, fontSize: small ? 10 : 11, letterSpacing: ".12em" }}>
      {r.label}
    </span>
  );
}

/* 敵カード(モジュールレベル=再生成されないので浮遊ダメージが再アニメしない) */
function EnemyCard({ e, disc, pending, hitId, floats, onAttack }) {
  const d = disc[e.bookId] || { w: [], r: [] };
  const known = [...(e.weak || []), ...(e.resist || [])];
  const revealed = e.rare || e.boss ? { w: e.weak, r: e.resist } : d;
  const hidden = known.some((t) => !revealed.w?.includes(t) && !revealed.r?.includes(t));
  const goodTarget = pending && e.hp > 0 && revealed.w?.includes(WEAPON_TYPES[pending.type].dmgType);
  const myFloats = floats.filter((f) => f.targetId === e.id);
  return (
    <div
      className={`kw-panel kw-enemy ${e.hp <= 0 ? "dead" : ""} ${e.rare ? "rare" : ""} ${e.boss ? "boss" : ""} ${pending ? "targetable" : ""} ${goodTarget ? "goodTarget" : ""} ${hitId === e.id ? "hit" : ""}`}
      onClick={() => { if (pending && e.hp > 0) onAttack(pending, e.id); }}
      role="button" aria-label={`${e.name}を狙う`}
    >
      {myFloats.map((f, i) => (
        <div key={f.key} className="kw-float" style={{ color: f.color, fontSize: f.size, left: `calc(50% + ${floatOffsetX(i, myFloats.length)}px)` }}>{f.text}</div>
      ))}
      <div className="kw-eicon">
        <AssetIcon assetId={e.asset} size={e.boss ? 54 : 36} color={e.rare ? "var(--hotaru)" : "var(--mist)"} />
      </div>
      <div className="kw-ename">{e.name}</div>
      <div className={`kw-hpbar ${e.boss ? "boss" : ""}`}><i style={{ width: `${(e.hp / e.maxHp) * 100}%` }} /></div>
      <div style={{ fontSize: 10, color: "var(--paper-dim)", marginTop: 3 }}>{e.hp} / {e.maxHp}</div>
      <div className="kw-affin">
        {revealed.w?.map((t) => <span key={"w" + t} className="kw-chip weak">弱 {t}</span>)}
        {revealed.r?.map((t) => <span key={"r" + t} className="kw-chip res">耐 {t}</span>)}
        {hidden && <span className="kw-chip unknown">?</span>}
        {e.rare && <span className="kw-chip weak">あと{e.fleeIn}T</span>}
      </div>
    </div>
  );
}

/* 武器カード(モジュールレベル) */
function WeaponCard({ w, g, onAttack, onSelect }) {
  if (!w) return (
    <div className="kw-panel kw-wcard" style={{ opacity: .35, cursor: "default", textAlign: "center", fontSize: 11, color: "var(--mist)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 74 }}>
      空きスロット
    </div>
  );
  const t = WEAPON_TYPES[w.type];
  const r = rarityOf(w.rarity);
  const cd = g.cds[w.id] || 0;
  const usable = g.phase === "battle" && !g.busy && cd === 0;
  const aoe = w.type === "book" || w.type === "instrument";
  return (
    <button className={`kw-panel kw-wcard ${g.pending?.id === w.id ? "selected" : ""}`}
      disabled={!usable}
      style={{ boxShadow: g.pending?.id === w.id ? undefined : r.glow }}
      onClick={() => {
        if (!usable) return;
        if (aoe) onAttack(w, null);
        else if (g.enemies.filter((e) => e.hp > 0).length === 1) onAttack(w, g.enemies.find((e) => e.hp > 0).id);
        else onSelect(w);
      }}
      title={t.desc}
    >
      {cd > 0 && <span className="kw-wcd">{cd}</span>}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <AssetIcon assetId={w.asset} size={18} color={r.color} />
        <RarityName item={w} small />
      </div>
      <div className="kw-wname">{w.name}</div>
      <div className="kw-wmeta">
        <span>攻 {w.atk}</span>
        <span className="kw-typechip">{t.dmgType}</span>
        <span style={{ fontSize: 10 }}>{t.tags[0]}</span>
      </div>
    </button>
  );
}

function ItemCell({ item, onClick, picked, equipped, actionLabel, hint }) {
  const r = rarityOf(item.rarity) || RARITIES[0];
  const meta = item.kind === "weapon"
    ? `${WEAPON_TYPES[item.type].label}・攻 ${item.atk}・${WEAPON_TYPES[item.type].dmgType}属性`
    : item.kind === "armor"
      ? `${ARMOR_TYPES[item.slot].label}・防 ${item.def}・HP+${item.hp}`
      : CONSUMABLES[item.itemId].desc;
  return (
    <button className={`kw-panel kw-cell ${picked ? "picked" : ""} ${equipped ? "equipped-mark" : ""}`}
      onClick={onClick} style={{ boxShadow: picked ? undefined : r.glow === "none" ? undefined : r.glow }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AssetIcon assetId={item.asset} size={20} color={r.color} />
        <RarityName item={item} small />
      </div>
      <div className="kw-cname">{item.name}</div>
      <div className="kw-cmeta">{meta}</div>
      {hint && <div className="kw-hint-diff" style={{ color: hint.up ? "#8fd39a" : hint.down ? "var(--paper-dim)" : "var(--hotaru)" }}>{hint.text}</div>}
      {actionLabel && <div style={{ marginTop: 6, fontSize: 10, color: "var(--hotaru)", letterSpacing: ".12em" }}>{actionLabel}</div>}
    </button>
  );
}

/* ============================================================
   難易度バランス設定 — すべてここで一元管理
   ここの数値を変えると難易度が変わります。
============================================================ */
const BALANCE = {
  // ── プレイヤー ──────────────────────────────
  playerHp: 72,            // 基礎HP

  // ── 通常敵スケーリング ────────────────────────
  enemyHpBase: 15,         // HP基礎値 (フロア0相当)
  enemyHpPerFloor: 7,      // フロアごとのHP増加 (小さいほど易しい)
  enemyAtkBase: 4,         // ATK基礎値
  enemyAtkPerFloor: 1.05,  // フロアごとのATK増加 (小さいほど易しい)
  enemyStageMult: 0.14,    // 章ごとの強化係数 (1 + 章番号×この値)
                           //   第1章:×1.0  第5章:×1.56  第10章:×2.26

  // ── ボス専用スケーリング ───────────────────────
  bossHpMult: 3.4,         // ボスHP倍率 (第1章基準)
  bossHpMultStep: 0.62,    // 章ごとに加算される倍率
  bossAtkMult: 1.3,        // ボスATK倍率 (第1章基準)
  bossAtkMultStep: 0.09,   // 章ごとに加算される倍率
  bossDefBase: 3,          // ボスDEF基礎値
  bossDefStep: 2.4,        // 章ごとのDEF増加

  // ── 武器・防具スケーリング ──────────────────────
  weaponGrowth: 0.09,      // フロアごとの武器ATK伸び率
  armorDefGrowth: 0.25,    // フロアごとの防具DEF増加
  armorHpGrowth: 0.06,     // フロアごとの防具HP伸び率

  // ── 属性相性 ────────────────────────────────
  affWeak: 1.6,            // 弱点ダメージ倍率
  affResist: 0.5,          // 耐性ダメージ倍率
};

/* ------------------------------------------------------------
   メインゲーム
------------------------------------------------------------ */
const BASE_HP = BALANCE.playerHp;
const AFF_WEAK = BALANCE.affWeak, AFF_RES = BALANCE.affResist;
// バックグラウンド中は setTimeout が停止し、復帰時にまとめて発火する。
// resolve 値の { stalled } で「長時間中断からの復帰」を呼び出し側が検知できるようにする(S2-5)。
const sleep = (ms) => new Promise((r) => {
  const start = Date.now();
  setTimeout(() => r({ stalled: Date.now() - start > ms + 2000 }), ms);
});

/* ---------- アイテムの自動ロック(旧・保護設定をロックへ統合) ----------
   「回復/希少アイテムを保護」は独立した保護フラグとしては持たず、該当する
   アイテムが袋・装備へ加わる瞬間に自動で locked:true を付けるだけにする。
   一度ロックされた後は個別の鍵アイコンで自由に解除でき、設定を OFF にしても
   既にロック済みのアイテムには遡って影響しない(解除は鍵アイコンのみで行う)。 */
const isHealItem = (it) => !!it && it.kind === "item" && ["heal", "cure"].includes(CONSUMABLES[it.itemId]?.kind);
// 「希少アイテムを保護」の対象: エピック/伝説の武具 + 雫・苔の心臓
const isHighValueItem = (it) => !!it && (
  ["epic", "legend"].includes(it.rarity) ||
  (it.kind === "item" && ["dew", "mossHeart"].includes(it.itemId))
);
function autoLockItem(it, meta) {
  if (!it || it.locked) return it;
  if ((meta?.protectHeals && isHealItem(it)) || (meta?.protectRareItems && isHighValueItem(it))) {
    return { ...it, locked: true };
  }
  return it;
}
function autoLockAll(list, meta) {
  return (list || []).map((it) => autoLockItem(it, meta));
}
function autoLockArmor(armor, meta) {
  if (!armor) return armor;
  return Object.fromEntries(Object.entries(armor).map(([k, v]) => [k, autoLockItem(v, meta)]));
}

function starterState(meta, initialWeaponType = "dagger") {
  // 継承品は前の生でのロック状態をそのまま引き継ぐ(毎回ロックし直さなくて済むように)。
  const inherited = (meta.inherited || []).map((it) => ({ ...it, id: uid(), locked: !!it.locked }));
  const inheritedIds = new Set(inherited.map((it) => it.id));
  const weaponCount = weaponSlotsOf(meta);
  const weapons = Array(weaponCount).fill(null);
  const armor = { helm: null, armor: null, charm: null };
  const inv = [];
  for (const it of inherited) {
    if (it.kind === "weapon") {
      const slot = weapons.findIndex((w) => !w);
      if (slot >= 0) weapons[slot] = it; else inv.push(it);
    } else if (it.kind === "armor") {
      if (!armor[it.slot]) armor[it.slot] = it; else inv.push(it);
    } else inv.push(it);
  }
  if (!weapons.some(Boolean)) {
    weapons[0] = makeWeapon(4, { type: initialWeaponType, rarity: "common" });
  }
  inv.push(makeConsumable("berrySmall"));
  inv.push(makeConsumable("berrySmall"));
  inv.push(makeConsumable("antidote"));
  if (meta?.skills?.startAntidote) inv.push(makeConsumable("antidote"));
  if (meta?.skills?.startAntidote2) inv.push(makeConsumable("antidote"));
  if (meta?.skills?.startBerryS) inv.push(makeConsumable("berrySmall"));
  if (meta?.skills?.startBerryS2) inv.push(makeConsumable("berrySmall"));
  if (meta?.skills?.fateMemory) inv.push(makeConsumable("spore"));
  if (meta?.skills?.fateMemory2) inv.push(makeConsumable("spore"));
  if (meta?.skills?.startBerryB) inv.push(makeConsumable("berryBig"));
  if (meta?.skills?.startBerryB2) inv.push(makeConsumable("berryBig"));
  // 保護設定による自動ロックは新しく手に入る品だけが対象(継承品は引き継いだ状態のまま)。
  const lockNew = (it) => (it && !inheritedIds.has(it.id) ? autoLockItem(it, meta) : it);
  return {
    weapons: weapons.map(lockNew),
    armor: Object.fromEntries(Object.entries(armor).map(([k, v]) => [k, lockNew(v)])),
    inv: inv.map(lockNew),
  };
}

function floorNodes(floor) {
  if (floorInStage(floor) === 10) return ["boss"];
  const mid = Math.random() < 0.45 ? (Math.random() < 0.55 ? "chest" : "spring") : "battle";
  return ["battle", mid, "battle"];
}

/* ---- 設定オーバーレイ (タイトル・ラン両画面で共用) ---- */
function SettingsOverlay({ onClose, bgmVolume, seVolume, changeBgmVolume, changeSeVolume,
                           sleepDisabled, toggleSleep, openURL, manageConsent, consentApplicable, cssClass,
                           meta, toggleMetaFlag }) {
  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center",
                     padding: "8px 0", fontSize: 12, color: "var(--mist)", borderBottom: "1px solid rgba(157,180,166,.08)" };
  const sectionLabel = { fontSize: 10, letterSpacing: ".3em", color: "var(--mist)", marginBottom: 10, marginTop: 4 };

  return (
    <div className={`kw-overlay ${cssClass || ""}`} onClick={onClose}>
      <div className="kw-panel kw-sheet" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ letterSpacing: ".2em" }}>設定</h2>

        {/* 音声 */}
        <div style={{ marginTop: 18 }}>
          <div style={sectionLabel}>音声</div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "var(--mist)", letterSpacing: ".2em" }}>BGM</span>
              <span style={{ fontSize: 14, color: bgmVolume === 0 ? "var(--mist)" : "var(--hotaru)", fontWeight: 700 }}>
                {bgmVolume === 0 ? "OFF" : `${bgmVolume}%`}
              </span>
            </div>
            <input type="range" min="0" max="100" step="1" className="kw-slider"
              defaultValue={bgmVolume} style={{ "--vol": `${bgmVolume}%` }}
              onChange={e => { const v = parseInt(e.target.value); e.target.style.setProperty("--vol", `${v}%`); changeBgmVolume(v); }} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "var(--mist)", letterSpacing: ".2em" }}>効果音 (SE)</span>
              <span style={{ fontSize: 14, color: seVolume === 0 ? "var(--mist)" : "var(--hotaru)", fontWeight: 700 }}>
                {seVolume === 0 ? "OFF" : `${seVolume}%`}
              </span>
            </div>
            <input type="range" min="0" max="100" step="1" className="kw-slider"
              defaultValue={seVolume} style={{ "--vol": `${seVolume}%` }}
              onChange={e => { const v = parseInt(e.target.value); e.target.style.setProperty("--vol", `${v}%`); changeSeVolume(v); }} />
          </div>
        </div>

        {/* 表示 */}
        <div style={{ marginTop: 24, borderTop: "1px solid rgba(157,180,166,.1)", paddingTop: 16 }}>
          <div style={sectionLabel}>表示</div>
          <div style={rowStyle}>
            <span style={{ letterSpacing: ".05em" }}>画面スリープ防止</span>
            <button className={`kw-btn ${sleepDisabled ? "primary" : "ghost"}`}
              style={{ padding: "4px 14px", fontSize: 11, minWidth: 44 }}
              onClick={toggleSleep}>
              {sleepDisabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* アイテム保護 */}
        {toggleMetaFlag && (
          <div style={{ marginTop: 24, borderTop: "1px solid rgba(157,180,166,.1)", paddingTop: 16 }}>
            <div style={sectionLabel}>アイテムの保護</div>
            <div style={{ fontSize: 10, color: "rgba(157,180,166,.7)", lineHeight: 1.7, marginBottom: 8 }}>
              ONにすると、これから拾う該当アイテムが自動でロックされます。今持っている品のロック状態は、ON/OFFを切り替えても変わりません。ロックは死亡後の継承でも引き継がれます。手放したい時は袋の中の鍵アイコンをもう一度押せば、その品だけロックを解除できます。
            </div>
            <div style={rowStyle}>
              <span style={{ letterSpacing: ".05em" }}>回復アイテムを保護</span>
              <button className={`kw-btn ${meta?.protectHeals ? "primary" : "ghost"}`}
                style={{ padding: "4px 14px", fontSize: 11, minWidth: 44 }}
                onClick={() => toggleMetaFlag("protectHeals")}>
                {meta?.protectHeals ? "ON" : "OFF"}
              </button>
            </div>
            <div style={{ ...rowStyle, borderBottom: "none" }}>
              <span style={{ letterSpacing: ".05em" }}>希少アイテムを保護
                <br /><span style={{ fontSize: 9, color: "rgba(157,180,166,.7)" }}>(エピック・伝説の武具、宝樹の雫、苔の心臓)</span>
              </span>
              <button className={`kw-btn ${meta?.protectRareItems ? "primary" : "ghost"}`}
                style={{ padding: "4px 14px", fontSize: 11, minWidth: 44, flexShrink: 0 }}
                onClick={() => toggleMetaFlag("protectRareItems")}>
                {meta?.protectRareItems ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        )}

        {/* プライバシー */}
        <div style={{ marginTop: 24, borderTop: "1px solid rgba(157,180,166,.1)", paddingTop: 16 }}>
          <div style={sectionLabel}>プライバシー</div>
          <div style={rowStyle}>
            <span style={{ letterSpacing: ".05em" }}>プライバシーポリシー</span>
            <button className="kw-btn ghost" style={{ padding: "4px 14px", fontSize: 11 }}
              onClick={() => openURL?.("https://eik-awa.github.io/privacy_policy/")}>
              開く <ExternalLink size={11} style={{ display: "inline", marginLeft: 3, verticalAlign: -1 }} />
            </button>
          </div>
          {consentApplicable && (
            <div style={{ ...rowStyle, borderBottom: "none" }}>
              <span style={{ letterSpacing: ".05em", maxWidth: 210, lineHeight: 1.6 }}>
                広告の同意設定を管理
                <br />
                <span style={{ fontSize: 9, color: "rgba(157,180,166,.7)" }}>(パーソナライズ広告への同意)</span>
              </span>
              <button className="kw-btn ghost" style={{ padding: "4px 14px", fontSize: 11, flexShrink: 0 }}
                onClick={() => {
                  // 設定オーバーレイ(WebView側)を閉じてから、少し間を置いてネイティブの同意画面を開く。
                  // 開いたまま重ねると、同意画面側のタップが正しく反応しないことがあるため。
                  onClose();
                  setTimeout(() => manageConsent?.(), 250);
                }}>
                開く
              </button>
            </div>
          )}
        </div>

        <div className="kw-actions" style={{ justifyContent: "center", marginTop: 24 }}>
          <button className="kw-btn ghost" style={{ padding: "10px 30px" }} onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   スキルツリー オーバーレイ
------------------------------------------------------------ */
const SKILL_ICON_MAP = {
  weaponSlot4: Swords, weaponSlot5: Swords, weaponSlot6: Swords,
  bladeBasics: Sword, bladeMastery: Sword, bladeEdge: Waves, critUp: Zap,
  magicBasics: Wand2, magicMastery: Wand2, magicEdge: Waves, magicWard: Shield,
  pierceBasics: Crosshair, pierceMastery: Crosshair, pierceEdge: Waves, pierceDepth: Crosshair,
  bluntBasics: Axe, bluntMastery: Axe, bluntEdge: Waves, bluntWeight: Axe,
  soundBasics: Music, soundMastery: Music, soundEdge: Waves, soundEcho: Music, soundDaze: Music,
  powerSeal: Flame,
  vitalitySeed: Heart, vitalityI: Heart, vitalityII: Heart,
  dodgeI: Wind, dodgeII: Wind,
  guardSeed: Shield, guardMastery: Shield,
  regenSeed: Sprout, regen: Sprout,
  lastStand: Bone,
  bagCapI: Package, bagCapII: Package, bagCapIII: Package,
  goldSenseI: Sparkles, goldSenseII: Sparkles, goldSenseIII: Sparkles, goldSenseIV: Sparkles,
  luckyEyeI: PiggyBank, luckyEyeII: PiggyBank,
  startAntidote: Leaf, startAntidote2: Leaf, startBerryS: Apple, startBerryS2: Apple,
  fateMemory: Cherry, fateMemory2: Cherry, startBerryB: Heart, startBerryB2: Heart,
};
const CAT_ICON_MAP = { "戦闘拡張": Swords, "生存": Heart, "探索": Leaf, "転生": Moon };
const SKILL_BY_ID = Object.fromEntries(SKILL_TREE.map((s) => [s.id, s]));
const SKILL_TREE_CATEGORIES = [...new Set(SKILL_TREE.map((s) => s.category))];

function SkillTreeOverlay({ meta, onClose, onBuy, onDismissRefund }) {
  const [selectedId, setSelectedId] = useState(null);
  const skills = meta?.skills || {};
  const dewBank = meta?.dewBank || 0;

  const isOwned = (id) => !!skills[id];
  const isRevealed = (skill) => skillPrereqsMet(skill, skills);
  const canBuy = (sk) => !isOwned(sk.id) && isRevealed(sk) && dewBank >= sk.cost;

  const selected = selectedId ? SKILL_BY_ID[selectedId] : null;
  const selectedOwned = selected ? isOwned(selected.id) : false;
  const selectedBuyable = selected ? canBuy(selected) : false;
  const selectedRevealed = selected ? isRevealed(selected) : false;

  // カテゴリ内スキルを木構造でフラット展開
  function buildRows(cat) {
    const catSkills = SKILL_TREE.filter(s => s.category === cat);
    const catIds = new Set(catSkills.map(s => s.id));
    const childrenOf = {};
    catSkills.forEach(s => {
      const parents = s.requiresAll || (s.requires ? [s.requires] : []);
      const inCatParent = parents.find(pid => catIds.has(pid));
      if (inCatParent) {
        if (!childrenOf[inCatParent]) childrenOf[inCatParent] = [];
        childrenOf[inCatParent].push(s.id);
      }
    });
    const hasParent = new Set(Object.values(childrenOf).flat());
    const roots = catSkills.filter(s => !hasParent.has(s.id));
    const result = [];
    const visited = new Set();
    function traverse(id, depth) {
      if (visited.has(id)) return;
      visited.add(id);
      const skill = SKILL_BY_ID[id];
      if (!skill) return;
      result.push({ skill, depth });
      (childrenOf[id] || []).forEach(cid => traverse(cid, depth + 1));
    }
    roots.forEach(r => traverse(r.id, 0));
    return result;
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-body)", overflow: "hidden",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        display: "flex", flexDirection: "column",
        background: "linear-gradient(180deg, rgba(16,27,21,.98), rgba(10,18,14,.99))",
        border: "1px solid rgba(157,180,166,.2)",
        borderRadius: 14,
        width: "calc(100% - 32px)", maxWidth: 480,
        maxHeight: "82vh",
        overflow: "hidden",
      }}>
      {/* ── ヘッダー ── */}
      <div style={{
        flexShrink: 0,
        padding: "12px 18px 10px",
        borderBottom: "1px solid rgba(157,180,166,.12)",
        background: "rgba(10,18,14,.7)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: ".2em", color: "var(--paper)" }}>スキルツリー</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4,
            padding: "2px 10px", borderRadius: 12,
            background: "rgba(232,180,74,.1)", border: "1px solid rgba(232,180,74,.3)" }}>
            <Sparkles size={10} color="var(--hotaru)" />
            <span style={{ fontSize: 11, color: "var(--hotaru)", fontWeight: 700 }}>{dewBank}</span>
            <span style={{ fontSize: 10, color: "rgba(232,180,74,.7)" }}>精の結晶</span>
          </div>
        </div>
        <button className="kw-btn ghost" style={{ padding: "6px 14px", flexShrink: 0 }} onClick={onClose}><X size={14} /></button>
      </div>

      {/* ── スキルリスト(スクロール) ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "12px 14px 6px" }}>

        {/* 結晶還元通知 */}
        {!!meta?.skillRefundNotice && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            padding: "8px 12px", marginBottom: 14, borderRadius: 8,
            background: "rgba(232,180,74,.12)", border: "1px solid rgba(232,180,74,.35)",
          }}>
            <div style={{ fontSize: 10, color: "var(--hotaru)", lineHeight: 1.6 }}>
              スキルツリーが再構成されました。失効したスキルの分、結晶を{meta.skillRefundNotice}個還元しました。
            </div>
            <button className="kw-btn ghost" style={{ padding: "4px 10px", fontSize: 10, flexShrink: 0 }} onClick={onDismissRefund}>OK</button>
          </div>
        )}

        {SKILL_TREE_CATEGORIES.map((cat) => {
          const CatIcon = CAT_ICON_MAP[cat] || Gem;
          const rows = buildRows(cat);
          return (
            <div key={cat} style={{ marginBottom: 22 }}>
              {/* カテゴリヘッダー */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(94,130,101,.18)", flexShrink: 0 }}>
                  <CatIcon size={12} color="var(--mist)" strokeWidth={1.5} />
                </div>
                <span style={{ fontSize: 10, letterSpacing: ".3em", color: "var(--mist)", whiteSpace: "nowrap" }}>{cat}</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(157,180,166,.2), transparent)" }} />
              </div>

              {rows.map(({ skill, depth }) => {
                const owned = isOwned(skill.id);
                const revealed = isRevealed(skill);
                const buyable = canBuy(skill);
                const isSelected = selectedId === skill.id;
                const Icon = SKILL_ICON_MAP[skill.id] || Gem;
                const accent = owned ? "var(--hotaru)" : buyable ? "#8fd39a" : revealed ? "var(--mist)" : "rgba(157,180,166,.2)";
                const INDENT = 16;
                return (
                  <div key={skill.id} style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
                    {depth > 0 && (
                      <div style={{ width: Math.min(depth, 3) * INDENT, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 5 }}>
                        <div style={{ width: 8, height: 1, background: "rgba(157,180,166,.22)" }} />
                      </div>
                    )}
                    <div
                      role="button"
                      onClick={() => setSelectedId(isSelected ? null : skill.id)}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", gap: 9,
                        padding: "8px 11px", borderRadius: 8, cursor: "pointer",
                        border: `1px solid ${isSelected ? "var(--hotaru)" : owned ? "rgba(232,180,74,.32)" : buyable ? "rgba(143,211,154,.28)" : "rgba(157,180,166,.1)"}`,
                        background: isSelected ? "rgba(232,180,74,.08)" : owned ? "rgba(232,180,74,.05)" : buyable ? "rgba(143,211,154,.04)" : "transparent",
                        transition: "border-color .15s",
                      }}
                    >
                      <Icon size={15} strokeWidth={1.6} color={accent} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                        <div style={{
                          fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)",
                          letterSpacing: ".04em", lineHeight: 1.25,
                          color: owned ? "var(--hotaru)" : revealed ? "var(--paper)" : "rgba(157,180,166,.28)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {revealed ? skill.name : "???"}
                        </div>
                        {revealed && (
                          <div style={{ fontSize: 10, color: "var(--mist)", marginTop: 1, lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {skill.desc}
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: 9, letterSpacing: ".08em", padding: "2px 7px", borderRadius: 3, flexShrink: 0,
                        background: owned ? "rgba(232,180,74,.18)" : buyable ? "rgba(143,211,154,.15)" : "rgba(157,180,166,.1)",
                        color: accent,
                      }}>
                        {owned ? "✦ 済" : revealed ? `${skill.cost}結晶` : "???"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── 詳細パネル(選択時) ── */}
      {selected && (
        <div style={{
          flexShrink: 0, borderTop: "1px solid rgba(157,180,166,.14)",
          padding: "11px 16px", background: "rgba(10,18,14,.7)",
        }}>
          {!selectedRevealed ? (
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--mist)", padding: "4px 0" }}>
              ??? 前提スキルを習得すると解放されます。
            </div>
          ) : (
            <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {React.createElement(SKILL_ICON_MAP[selected.id] || Gem, { size: 18, strokeWidth: 1.5, color: selectedOwned ? "var(--hotaru)" : "var(--mist)" })}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: selectedOwned ? "var(--hotaru)" : "var(--paper)" }}>
                    {selected.name}
                  </div>
                  <span style={{
                    fontSize: 9, padding: "2px 8px", borderRadius: 3, flexShrink: 0, letterSpacing: ".08em",
                    background: selectedOwned ? "rgba(232,180,74,.18)" : selectedBuyable ? "rgba(143,211,154,.15)" : "rgba(157,180,166,.1)",
                    color: selectedOwned ? "var(--hotaru)" : selectedBuyable ? "#8fd39a" : "var(--mist)",
                  }}>
                    {selectedOwned ? "✦ 習得済" : `${selected.cost} 結晶`}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--mist)", lineHeight: 1.6, marginTop: 3 }}>{selected.desc}</div>
                {selected.requiresAll && (
                  <div style={{ fontSize: 9, color: "var(--mist)", marginTop: 3, opacity: .7 }}>
                    前提: {selected.requiresAll.map(pid => SKILL_BY_ID[pid]?.name || pid).join(" ・ ")}
                  </div>
                )}
                {selectedBuyable && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                    <button className="kw-btn primary" style={{ padding: "5px 18px", fontSize: 11 }}
                      onClick={() => onBuy(selected.id)}>この結晶で習得する</button>
                  </div>
                )}
                {!selectedOwned && !selectedBuyable && dewBank < (selected.cost || 0) && selectedRevealed && (
                  <div style={{ fontSize: 10, color: "var(--danger)", marginTop: 4 }}>
                    結晶が足りません（あと{selected.cost - dewBank}個）。
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── フッター ── */}
      <div style={{ flexShrink: 0, padding: "8px 18px 12px", display: "flex", justifyContent: "center", borderTop: "1px solid rgba(157,180,166,.08)" }}>
        <button className="kw-btn ghost" style={{ padding: "9px 48px" }} onClick={onClose}>閉じる</button>
      </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   図鑑 オーバーレイ
------------------------------------------------------------ */
function BestiaryOverlay({ meta, onClose }) {
  const [chIdx, setChIdx] = useState(null); // null = 章選択, number = 敵グリッド
  const [selected, setSelected] = useState(null); // { bookId, isBoss }
  const seen = meta?.seen || {};
  const discovered = meta?.discovered || {};
  const checkpoint = meta?.checkpoint || 1;

  // 章 i の「固有敵リスト」: それより前の章に同じ敵がいれば除外
  function uniqueEnemies(stageIdx) {
    const prior = new Set(STAGES.slice(0, stageIdx).flatMap((s) => s.enemies));
    return STAGES[stageIdx].enemies.filter((id) => !prior.has(id));
  }

  // 遭遇済み敵がいる章を表示（クリア未済でも可）
  const clearedStages = STAGES.map((st, i) => ({ st, i, ch: i + 1 }))
    .filter(({ i }) => uniqueEnemies(i).some((id) => seen[id]) || (STAGES[i].boss?.id && seen[STAGES[i].boss.id]));

  const totalSeen = clearedStages.reduce((sum, { i, st }) => {
    const bSeen = st.boss?.id && seen[st.boss.id] ? 1 : 0;
    return sum + uniqueEnemies(i).filter((id) => seen[id]).length + bSeen;
  }, 0);
  const totalEnemies = clearedStages.reduce((sum, { i, st }) => sum + uniqueEnemies(i).length + 1, 0);

  const stage = chIdx !== null ? STAGES[chIdx] : null;
  const boss = stage?.boss;

  function AffinityChips({ bookId, weak, resist }) {
    const d = discovered[bookId] || { w: [], r: [] };
    const allTypes = [...(weak || []), ...(resist || [])];
    const anyUnknown = allTypes.some((t) => !d.w.includes(t) && !d.r.includes(t));
    if (d.w.length === 0 && d.r.length === 0 && !anyUnknown) return null;
    return (
      <div className="kw-affin" style={{ justifyContent: "flex-start", marginTop: 6 }}>
        {d.w.map((t) => <span key={t} className="kw-chip weak">{t}</span>)}
        {d.r.map((t) => <span key={t} className="kw-chip res">{t}</span>)}
        {anyUnknown && <span className="kw-chip unknown">?</span>}
      </div>
    );
  }

  function EntryCell({ bookId, isBoss }) {
    const b = isBoss ? boss : ENEMY_BOOK[bookId];
    if (!b) return null;
    const id = isBoss ? boss.id : bookId;
    const isSeen = !!seen[id];
    const a = isSeen ? ASSETS[b.asset] : null;
    const IconC = a?.icon || Package;
    return (
      <div className={`kw-bestiary-cell ${isSeen ? "seen" : "unseen"}`}
        onClick={isSeen ? () => setSelected({ bookId: id, isBoss }) : undefined}>
        <div className={`kw-bestiary-cell-icon${isBoss ? " boss" : ""}`}>
          {isSeen
            ? <IconC size={20} color={isBoss ? "var(--hotaru)" : "var(--paper)"} strokeWidth={1.6} />
            : <span style={{ fontSize: 15, color: "var(--mist)", fontWeight: 700 }}>?</span>
          }
        </div>
        <div className="kw-bestiary-cell-label" style={{ color: isBoss && isSeen ? "var(--hotaru)" : undefined }}>
          {isSeen ? b.name : "???"}
        </div>
      </div>
    );
  }

  function DetailCard() {
    if (!selected || !stage) return null;
    const { bookId, isBoss } = selected;
    const b = isBoss ? boss : ENEMY_BOOK[bookId];
    if (!b) return null;
    const a = ASSETS[b.asset];
    const IconC = a?.icon || Package;
    return (
      <div className="kw-bestiary-detail-bg" onClick={() => setSelected(null)}>
        <div className="kw-bestiary-detail-card" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div className={`kw-bestiary-cell-icon${isBoss ? " boss" : ""}`} style={{ width: 48, height: 48 }}>
              <IconC size={24} color={isBoss ? "var(--hotaru)" : "var(--paper)"} strokeWidth={1.5} />
            </div>
            <div>
              {isBoss && <div style={{ fontSize: 9, letterSpacing: ".25em", color: "var(--hotaru)", marginBottom: 2 }}>ボス</div>}
              <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, letterSpacing: ".06em",
                color: isBoss ? "var(--hotaru)" : "var(--paper)" }}>{b.name}</div>
            </div>
          </div>
          {b.note && <div style={{ fontSize: 11, color: "var(--mist)", lineHeight: 1.7, marginBottom: 4 }}>{b.note}</div>}
          <AffinityChips bookId={bookId} weak={b.weak} resist={b.resist} />
          <button className="kw-btn ghost" style={{ marginTop: 14, padding: "4px 14px", fontSize: 11, width: "100%" }}
            onClick={() => setSelected(null)}>閉じる</button>
        </div>
      </div>
    );
  }

  return (
    <div className="kw-overlay top" onClick={onClose}>
      <div className="kw-panel kw-sheet"
        style={{ maxWidth: 480, maxHeight: "88vh", display: "flex", flexDirection: "column", position: "relative" }}
        onClick={(e) => e.stopPropagation()}>
        {selected && <DetailCard />}

        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h2 style={{ letterSpacing: ".2em" }}>図 鑑</h2>
            {chIdx !== null
              ? <div className="kw-sub">
                  <button style={{ background: "none", border: "none", color: "var(--mist)", fontSize: 11, cursor: "pointer", padding: 0, letterSpacing: ".05em" }}
                    onClick={() => { setChIdx(null); setSelected(null); }}>
                    ← 章一覧へ
                  </button>
                </div>
              : <div className="kw-sub">発見: {totalSeen} / {totalEnemies}</div>
            }
          </div>
          <button className="kw-btn ghost" style={{ padding: "4px 12px", fontSize: 11 }} onClick={onClose}>閉じる</button>
        </div>

        {/* 章選択 */}
        {chIdx === null && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {clearedStages.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--mist)", fontSize: 12, padding: "30px 0" }}>
                まだ図鑑に記録がありません。<br />章をクリアすると解放されます。
              </div>
            ) : (
              <div className="kw-bestiary-ch-grid">
                {clearedStages.map(({ st, i, ch }) => {
                  const uq = uniqueEnemies(i);
                  const stSeen = uq.filter((id) => seen[id]).length + (st.boss?.id && seen[st.boss.id] ? 1 : 0);
                  const stTotal = uq.length + 1;
                  return (
                    <button key={i} className="kw-bestiary-ch-card" onClick={() => setChIdx(i)}>
                      <StageBackdrop floor={i * 10 + 1} preview={true} />
                      <div className="kw-bestiary-ch-info">
                        <div style={{ fontSize: 9, color: "rgba(157,180,166,.7)", letterSpacing: ".25em", marginBottom: 2 }}>第{ch}章</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--paper)", lineHeight: 1.3 }}>{st.name}</div>
                        <div style={{ fontSize: 9, color: "#8fd39a", marginTop: 2 }}>発見 {stSeen}/{stTotal}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 敵グリッド */}
        {chIdx !== null && stage && (
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
            <div className="kw-bestiary-grid">
              {uniqueEnemies(chIdx).map((bookId) => <EntryCell key={bookId} bookId={bookId} isBoss={false} />)}
            </div>
            <div className="kw-bestiary-boss-sep">── ボス ──</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: "calc(20% - 3px)" }}>
                <EntryCell isBoss={true} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KiriwatariNoMori() {
  const [meta, setMeta] = useState(null);
  const [g, setG] = useState({ screen: "title" });
  const gRef = useRef(g); gRef.current = g;
  const metaRef = useRef(meta); metaRef.current = meta;
  const logRef = useRef(null);

  // meta の更新は必ずこれを経由する(S-1 対策)。コンポーネント本体の `meta` 変数(クロージャ)は
  // 直近のレンダー時点のスナップショットで止まっており、同じ関数呼び出しの流れの中で複数箇所が
  // それぞれ `{ ...meta, ... }` を作って setMeta すると、後から呼ばれた側が先に確定した差分を
  // 古い meta で丸ごと上書きしてしまう(例: startFromChapter が inherited:[] を確定させた直後、
  // 同じ流れで呼ばれる enterNode が古い meta を土台に上書きし、消費済みの継承品を復活させる)。
  // `metaRef.current` は setMeta 呼び出しのたびにこの関数内で即座に更新するので、同一tick内の
  // 連続呼び出しでも必ず直前の確定値の上に積み上がる。
  const updateMeta = (patch) => {
    const m = metaRef.current;
    const next = typeof patch === "function" ? patch(m) : { ...m, ...patch };
    metaRef.current = next;
    setMeta(next); saveMeta(next);
    return next;
  };

  // 非同期シーケンス(攻撃 → 敵ターン等)の世代トークン(S2-2)。
  // アクション開始時に採番し、await をまたぐたびに一致確認する。
  // ラン開始・タイトルへ戻る・死亡確定・バックグラウンド遷移で ++ して進行中の継続を無効化する。
  const seqRef = useRef(0);
  const bumpSeq = () => { seqRef.current++; };

  // アイテム使用・装備変更のあとにランを保存する(S2-3)。連続タップでの書き込み集中を避けるため
  // 300ms デバウンスする。saveRun の引数が多いのでスナップショットを丸ごと受け取る。
  // 未回収の確定ドロップを持つ画面は "clear"(章ボス撃破)だけでなく "reward"(通常/レア敵
  // 撃破の戦利品画面。金枝の精の宝樹の雫もここに含まれる)も対象にする。これが無いと、
  // 雫の広告視聴直後などにタスキルすると、まだ「拾う」を押していないドロップ一式が
  // 復元時に丸ごと消える(実バグ発見・修正: 以前は "clear" しか見ておらず、
  // ボス以外の戦利品画面が保存対象から漏れていた)。
  const hasUncollectedReward = (phase) => phase === "clear" || phase === "reward";
  const saveRunTimerRef = useRef(null);
  const scheduleSaveRun = (s) => {
    if (!s || !s.floor || s.phase === "dead") return;
    if (saveRunTimerRef.current) clearTimeout(saveRunTimerRef.current);
    const snap = s;
    saveRunTimerRef.current = setTimeout(() => {
      saveRunTimerRef.current = null;
      saveRun(snap.floor, snap.node, snap.player, snap.weapons, snap.armor, snap.inv,
        snap.cds, snap.lastRareSeen, snap.orbBagBonus,
        snap.phase === "battle" ? snap.enemies : null,
        hasUncollectedReward(snap.phase) ? snap.phase : null,
        hasUncollectedReward(snap.phase) ? snap.drops : null);
    }, 300);
  };
  const flushSaveRun = (s) => {
    if (saveRunTimerRef.current) { clearTimeout(saveRunTimerRef.current); saveRunTimerRef.current = null; }
    if (!s || !s.floor || s.phase === "dead") return;
    saveRun(s.floor, s.node, s.player, s.weapons, s.armor, s.inv,
      s.cds, s.lastRareSeen, s.orbBagBonus, s.phase === "battle" ? s.enemies : null,
      hasUncollectedReward(s.phase) ? s.phase : null,
      hasUncollectedReward(s.phase) ? s.drops : null);
  };

  // --- 音声 (BGM + SE ともに Swift ネイティブ AVAudioPlayer で再生) ---
  // JS Audio は一切使わない。WebKit が AVAudioSession を .playback に上書きするのを防ぎ
  // Apple Music との共存 (.ambient + .mixWithOthers) を維持するため。
  const bgmFallbackRef = useRef(null); // ネイティブ不可環境用 BGM フォールバック
  const seFallbackRef  = useRef(null); // ネイティブ不可環境用 SE フォールバック
  const bgmVolRef      = useRef(70);
  const seVolRef       = useRef(80);
  const bgmStartedRef  = useRef(false);
  const [startWeapon, setStartWeapon] = useState("dagger");
  const [bgmVolume, setBgmVolume] = useState(() => {
    try { const v = localStorage.getItem("kw-bgm-v"); return v !== null ? Math.max(0, Math.min(100, parseInt(v))) : 70; } catch { return 70; }
  });
  const [seVolume, setSeVolume] = useState(() => {
    try { const v = localStorage.getItem("kw-se-v");  return v !== null ? Math.max(0, Math.min(100, parseInt(v))) : 80; } catch { return 80; }
  });
  const [savedRun, setSavedRun] = useState(null);
  const [discardConfirm, setDiscardConfirm] = useState(null); // null or item to discard
  // 武器スロットの並び替え: スクロールと競合するドラッグをやめ、武器だけのポップアップで
  // 「入れ替えたい2枠を順にタップ」する方式にする。
  const [reorderPopup, setReorderPopup] = useState(false);
  const [reorderSel, setReorderSel] = useState(null);
  // ポップアップ内のドラッグ: タップ(ほぼ動かさない)なら選択、動かして別スロットの上で離せば入れ替え。
  const [popDrag, setPopDrag] = useState(null); // { idx, x0, y0, dx, dy, over }
  const popSlotRefs = useRef({});
  // 「遊び方」画面のタブ(章ごとにボタンで切り替え)。
  const [guideTab, setGuideTab] = useState("battle");
  // 不具合お詫び配布(精の結晶 x5)。meta 読み込み後、未受け取りなら true にする。
  const [showCompensation, setShowCompensation] = useState(false);

  const [sleepDisabled, setSleepDisabled] = useState(() => {
    try { return localStorage.getItem("kw-sleep") !== "0"; } catch { return true; }
  });

  // GDPR/米国州法が実際に適用される地域のユーザーかどうか。適用対象外(日本など)では
  // 設定画面に「広告の同意設定を管理」の項目自体を出さない。appReady 応答で確定するまでは false。
  const [consentApplicable, setConsentApplicable] = useState(false);
  // 起動後1回だけ表示するイベント告知バナー(イベント期間外は false で初期化)
  const [showEventBanner, setShowEventBanner] = useState(() => {
    if (!EVENT_ENABLED) return false;
    const today = eventJstDay(Date.now());
    return today >= EVENT_START && today <= EVENT_END;
  });

  useEffect(() => { bgmVolRef.current = bgmVolume; }, [bgmVolume]);
  useEffect(() => { seVolRef.current  = seVolume;  }, [seVolume]);

  // 初回レンダリング完了を Swift に通知してスプラッシュ画面を消す + 起動時設定を復元
  useEffect(() => {
    window.__setConsentApplicable__ = (value) => setConsentApplicable(!!value);
    try { window.webkit?.messageHandlers?.appReady?.postMessage({}); } catch {}
    try {
      const sl = localStorage.getItem("kw-sleep") !== "0";
      window.webkit?.messageHandlers?.settings?.postMessage({ sleep: sl });
    } catch {}
    return () => { delete window.__setConsentApplicable__; };
  }, []);

  const openURL = (url) => {
    try { window.webkit?.messageHandlers?.openURL?.postMessage({ url }); } catch {}
  };

  // ユーザーが自分から「レビューする」を押したときは、App Store のレビュー投稿画面を直接開く。
  // SKStoreReviewController は年3回・表示保証なしのため、能動的な導線には使わない。
  // URL を開くと「アドレスが無効」になるケースがあるため、
  // ネイティブの AppStore.requestReview ダイアログを使う。
  const writeReview = () => {
    try { window.webkit?.messageHandlers?.requestReview?.postMessage({}); } catch {}
  };

  // GDPR/CCPA: 同意の選択(パーソナライズ広告の許諾・販売しない設定等)を後からやり直せるようにする。
  const manageConsent = () => {
    try { window.webkit?.messageHandlers?.privacy?.postMessage({ action: "manageConsent" }); } catch {}
  };

  // リワード広告(ネイティブ側の LevelPlay)を要求する。結果は __onRewardAdResult__ に届く。
  const requestRewardAd = (contextId) => {
    // リトライ時に前回の失敗エラーを消す
    setG((s) => ({ ...s, rewardAdPending: contextId, rewardAdFailedAt: null, rewardAdFailReason: null }));
    try { window.webkit?.messageHandlers?.rewardAd?.postMessage({ action: "show", context: contextId }); } catch (_) {
      setG((s) => (s.rewardAdPending === contextId ? { ...s, rewardAdPending: null } : s));
    }
  };

  // リワード広告が出せなかったときの案内文(S1-5)。読込中は表示しない。
  const rewardAdFailNote = (style) => {
    if (!g.rewardAdFailedAt || g.rewardAdPending != null) return null;
    const loadfail = g.rewardAdFailReason !== "dismissed";
    return (
      <div style={{ textAlign: "center", fontSize: 10.5, color: "var(--danger)", marginTop: 8, lineHeight: 1.75, ...(style || {}) }}>
        {loadfail
          ? "広告を読み込めませんでした。通信環境をご確認ください。広告ブロック機能・コンテンツブロッカー・プライベートDNS・VPN が有効な場合は解除のうえ、アプリを一度終了して再起動してからお試しください。"
          : "報酬を受け取るには、広告を最後まで視聴してください。"}
      </div>
    );
  };

  // リワード広告の結果コールバック。gRef/metaRef 経由で常に最新の状態を扱う。
  // result は "rewarded" | "dismissed" | "unavailable" | "timeout"(旧 boolean も許容・S1-5)。
  useEffect(() => {
    window.__onRewardAdResult__ = (contextId, result) => {
      const s0 = gRef.current;
      if (s0.rewardAdPending !== contextId) return; // 別画面に移動済みなら無視
      const r = result === true ? "rewarded"
              : result === false ? "unavailable"
              : String(result || "unavailable");
      try {
        window.webkit?.messageHandlers?.progress?.postMessage({ event: "reward_ad_result", context: contextId, result: r });
      } catch (_) {}
      if (r !== "rewarded") {
        // unavailable / timeout はロード不能、dismissed は視聴中断。UI の文言を出し分ける。
        const reason = (r === "unavailable" || r === "timeout") ? "loadfail" : "dismissed";
        setG((s) => (s.rewardAdPending === contextId
          ? { ...s, rewardAdPending: null, rewardAdFailedAt: Date.now(), rewardAdFailReason: reason }
          : s));
        return;
      }
      bumpSeq(); // 復活等で状態が切り替わるため進行中シーケンスを無効化(S2-2)
      updateMeta((m) => contextId === "revive"
        ? { ...consumeRewardAdUse(m), reviveUsedThisRun: true }
        : consumeRewardAdUse(m));
      // AD-02: window.__onRewardAdResult__ はネイティブ側からの直接呼び出しであり、React の
      // SyntheticEvent(discrete event)としては扱われない。そのため以前の実装(setG(updater)
      // の中で `committed` へ結果を捕まえ、その後 `if (committed) flushSaveRun(committed)` する
      // パターン)は、updater が同期的に呼ばれる保証がここには無く、実際に committed が
      // null のまま flushSaveRun が一度も呼ばれない(広告の報酬がライブ表示のみに留まり
      // 保存されない)ケースが確認された。gRef.current から同期的に読み、素の値で setG する
      // 安全な形(useItem/equipItem と同じパターン)に統一する。
      if (contextId === "dew") {
        // 広告の報酬は袋に直接入れて即保存する。ドロップに置くと、回収前に
        // アプリを終了された場合に消えてしまう(視聴回数だけ消費される)。
        const s0 = gRef.current;
        if (s0.rewardAdPending === "dew") {
          const dew = makeConsumable("dew");
          const cap = invCapOf(metaRef.current, s0.orbBagBonus || 0);
          const base = { ...s0, rewardAdPending: null, dewAdClaimed: true };
          const ns = s0.inv.length < cap
            ? pushLog({ ...base, inv: [...s0.inv, dew] }, "広告視聴の報酬。宝樹の雫が袋に加わった!", true)
            : pushLog({ ...base, drops: [...s0.drops, dew] }, "広告視聴の報酬。宝樹の雫がもう一つ生まれた!(袋が満杯のため戦利品へ)", true);
          setG(ns);
          gRef.current = ns;
          flushSaveRun(ns);
        }
      } else if (contextId === "revive") {
        const s0 = gRef.current;
        if (s0.rewardAdPending === "revive") {
          const mx = maxHpOf(s0, metaRef.current);
          const revived = { ...s0.player, hp: mx, poison: 0, atkDown: 0 };
          const ns = pushLog({ ...s0, phase: "battle", busy: false, rewardAdPending: null, reviveUsed: true, player: revived },
            "広告の加護で、満身の力で息を吹き返した!", true);
          setG(ns);
          gRef.current = ns;
          flushSaveRun(ns); // 復活後の状態を即保存(再起動しても復活が反映される)
        }
      } else if (contextId === "eventDew") {
        setG((s) => {
          if (s.rewardAdPending !== "eventDew") return s;
          return { ...s, rewardAdPending: null,
            event: { ...s.event, reward2x: true, adClaimed: true } };
        });
        // meta.eventReward にも reward2x を保存し、× で閉じても復元できるようにする
        if (metaRef.current?.eventReward) {
          updateMeta((mr) => ({ ...mr, eventReward: { ...mr.eventReward, reward2x: true } }));
        }
      }
    };
    return () => { delete window.__onRewardAdResult__; };
  }, []);

  function toggleSleep() {
    const next = !sleepDisabled;
    setSleepDisabled(next);
    try { localStorage.setItem("kw-sleep", next ? "1" : "0"); } catch {}
    try { window.webkit?.messageHandlers?.settings?.postMessage({ sleep: next }); } catch {}
  }

  // meta の真偽フラグ(アイテム保護設定など)を切り替えて永続化する
  async function toggleMetaFlag(key) {
    if (!metaRef.current) return;
    // 保護設定は「これから手に入る品」の自動ロックにだけ使う。ON/OFF を切り替えても、
    // 今持っている品のロック状態は変えない(ロックの解除・設定は鍵アイコンのみ)。
    updateMeta((m) => ({ ...m, [key]: !m[key] }));
  }

  // 袋の並び順設定を切り替えて永続化する
  function setBagSortMode(mode) {
    if (!metaRef.current) return;
    updateMeta((m) => ({ ...m, bagSortMode: mode }));
  }

  // ネイティブハンドラへ BGM メッセージを送信
  const sendBGM = (action, volume) => {
    const msg = { a: action };
    if (volume !== undefined) msg.v = volume;
    try { window.webkit?.messageHandlers?.bgm?.postMessage(msg); } catch {}
  };

  // ネイティブハンドラへ SE メッセージを送信 (ch:"se" でルーティング)
  const sendSE = (action, volume) => {
    const msg = { a: action, ch: "se" };
    if (volume !== undefined) msg.v = volume;
    try { window.webkit?.messageHandlers?.bgm?.postMessage(msg); } catch {}
  };

  const bgmFbSetVol = (v) => {
    const fb = bgmFallbackRef.current; if (!fb) return;
    fb.volume = v / 100 * 0.5;
    if (v > 0 && fb.paused && bgmStartedRef.current) fb.play().catch(() => {});
    else if (v <= 0 && !fb.paused) fb.pause();
  };

  // 音声起動。ネイティブ WKWebView では AVAudioPlayer に user gesture 制約がないので即時起動。
  // ブラウザ等のフォールバック環境のみ初回タップを待つ。
  useEffect(() => {
    const initAudio = () => {
      if (bgmStartedRef.current) return;
      bgmStartedRef.current = true;
      const vol   = bgmVolRef.current;
      const seVol = seVolRef.current;
      if (window.webkit?.messageHandlers?.bgm) {
        if (vol > 0) sendBGM("play", vol / 100);
        sendSE("volume", seVol / 100 * 0.85);
      } else {
        const bgm = new Audio("kwapp://app/Where_the_Willow_Bends.mp3");
        bgm.loop = true; bgm.volume = vol / 100 * 0.5;
        bgmFallbackRef.current = bgm;
        if (vol > 0) bgm.play().catch(() => {});
        const se = new Audio("kwapp://app/attack.mp3");
        se.volume = seVol / 100 * 0.85; se.preload = "none";
        seFallbackRef.current = se;
      }
    };

    if (window.webkit?.messageHandlers?.bgm) {
      // ネイティブ: 直接起動
      initAudio();
    } else {
      // ブラウザ: 初回タップ後に起動
      document.addEventListener("click",      initAudio, { once: true });
      document.addEventListener("touchstart", initAudio, { once: true });
      return () => {
        document.removeEventListener("click",      initAudio);
        document.removeEventListener("touchstart", initAudio);
      };
    }
  }, []);

  // スリープ/バックグラウンド時に BGM を停止・復帰 + ゲーム状態の整合(S2-4)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        sendBGM("pause");
        const fb = bgmFallbackRef.current; if (fb && !fb.paused) fb.pause();
        try {
          window.webkit?.messageHandlers?.progress?.postMessage({ event: "app_hidden" });
        } catch (_) {}
        // 現在の状態をバックグラウンド入り時点で保存する(OSに強制終了されても続きから再開できるように)。
        // ここで busy を強制解除したり世代(seqRef)を進めたりはしない。
        // 進行中のアクション(攻撃/道具/防御→敵ターン)は afterPlayerAction/enemyPhase が
        // 常に gRef.current を再読込してから続けるため、バックグラウンドを挟んでも安全に再開できる。
        // 以前はここで busy:false + bumpSeq() していたが、「道具を使った直後に一瞬だけ
        // バックグラウンドへ切り替えて戻す」操作で敵の反撃を丸ごとスキップしたまま回復だけ得られる
        // 無敵回復の抜け道になっていたため廃止した(busy 固着そのものは3秒の watchdog が担当)。
        const cur = gRef.current;
        if (cur && cur.floor) flushSaveRun(cur);
      } else {
        if (bgmStartedRef.current && bgmVolRef.current > 0) {
          sendBGM("play");
          const fb = bgmFallbackRef.current; if (fb && fb.paused) fb.play().catch(() => {});
        }
        // 復帰時: 古いフロートの一斉表示だけ防ぐ(busy/世代には触れない)。
        setG((s) => (s && s.floor ? { ...s, floats: [] } : s));
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // タイトルへ戻ったら進行中の非同期シーケンスを無効化する(S2-2)
  useEffect(() => { if (g.screen === "title") bumpSeq(); }, [g.screen]);

  // busy 固着の保険: 戦闘中に状態変化が 3 秒途切れたら操作不能を解除する。
  // 攻撃・敵ターンの setG は最長でも 0.65 秒以内ごとに走るので、3 秒無変化 = 異常。
  // g を丸ごと依存に入れているので、何らかの setG が走るたびにタイマーがリセットされる。
  useEffect(() => {
    if (!g.busy || g.phase !== "battle" || g.screen !== "run") return;
    const id = setTimeout(() => {
      setG((s) => (s.busy && s.phase === "battle" ? { ...s, busy: false } : s));
    }, 3000);
    return () => clearTimeout(id);
  }, [g]);

  // 新しいログが追加されたら自動で末尾へスクロール
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [g.logs]);

  function changeBgmVolume(v) {
    setBgmVolume(v); bgmVolRef.current = v;
    sendBGM("volume", v / 100);
    bgmFbSetVol(v);
    try { localStorage.setItem("kw-bgm-v", String(v)); } catch {}
  }
  function changeSeVolume(v) {
    setSeVolume(v); seVolRef.current = v;
    sendSE("volume", v / 100 * 0.85);
    const se = seFallbackRef.current; if (se) se.volume = v / 100 * 0.85;
    try { localStorage.setItem("kw-se-v", String(v)); } catch {}
  }

  function playAttackSound() {
    if (seVolume === 0) return;
    if (window.webkit?.messageHandlers?.bgm) {
      sendSE("play");
    } else {
      const snd = seFallbackRef.current; if (!snd) return;
      snd.currentTime = 0; snd.play().catch(() => {});
    }
  }

  useEffect(() => {
    loadMeta().then((m) => {
      let migrated = migrateSkillTree(m);
      // 旧セーブの引き継ぎ: everHadWeapon 導入前からのプレイヤーは、進行の跡
      // (死亡・踏破・クリア済み章)があれば「一度も武器を持ったことがない」わけが
      // ないので、タイトルの武器選択を二度と出さないよう一度だけ補完する。
      if (!migrated.everHadWeapon && (migrated.deaths > 0 || migrated.bestFloor > 1 || migrated.clears > 0 || (migrated.checkpoint || 1) > 1)) {
        migrated = { ...migrated, everHadWeapon: true };
      }
      if (migrated !== m) saveMeta(migrated);
      setMeta(migrated);
      // 不具合お詫び配布: 未受け取りなら起動時に1回だけポップアップで知らせる。
      if (!migrated.compensationDewClaimed) setShowCompensation(true);
    });
    loadRun().then((run) => { if (run && (run.floor || run.phase === "dead")) setSavedRun(run); });
  }, []);

  // 不具合お詫びの精の結晶を受け取る(1回きり)。
  async function claimCompensationDew() {
    if (!metaRef.current || metaRef.current.compensationDewClaimed) { setShowCompensation(false); return; }
    updateMeta((m) => ({ ...m, dewBank: (m.dewBank || 0) + COMPENSATION_DEW_AMOUNT, compensationDewClaimed: true }));
    setShowCompensation(false);
  }

  const invCap = invCapOf(meta, g?.orbBagBonus || 0);

  async function buySkill(skillId) {
    const m0 = metaRef.current;
    if (!m0) return;
    const skill = SKILL_TREE.find((s) => s.id === skillId);
    if (!skill || (m0.dewBank || 0) < skill.cost) return;
    if (!skillPrereqsMet(skill, m0.skills)) return;
    if (m0.skills?.[skillId]) return;
    const m2 = updateMeta({
      ...m0,
      dewBank: m0.dewBank - skill.cost,
      skills: { ...m0.skills, [skillId]: true },
    });

    // 武器スロット拡張は g.weapons の長さが固定のため、進行中のランには
    // starterState を通らないと反映されない。ここで即座にスロットを増やす。
    if (skillId === "weaponSlot4" || skillId === "weaponSlot5" || skillId === "weaponSlot6") {
      const s0 = gRef.current;
      if (s0.screen === "run" && Array.isArray(s0.weapons)) {
        const want = weaponSlotsOf(m2);
        if (s0.weapons.length < want) {
          const weapons = [...s0.weapons];
          while (weapons.length < want) weapons.push(null);
          const ns = { ...s0, weapons };
          setG(ns);
          scheduleSaveRun(ns);
        }
      }
    }
  }

  async function dismissRefundNotice() {
    const m0 = metaRef.current;
    if (!m0) return;
    updateMeta({ ...m0, skillRefundNotice: undefined });
  }

  const armorDef = (st, m = meta) => {
    const base = Object.values(st.armor).reduce((a, x) => a + (x ? x.def : 0), 0);
    return Math.round(base * (1 + skillEffectTotal(m?.skills, "defPct")));
  };
  const maxHpOf = (st, m = meta) => BASE_HP + (m?.bonusHp || 0) +
    skillEffectTotal(m?.skills, "maxHp") +
    Object.values(st.armor).reduce((a, x) => a + (x ? x.hp : 0), 0);

  const pushLog = (st, text, strong = false) =>
    ({ ...st, logs: [...st.logs.slice(-29), { text, strong, k: uid() }] });

  const addFloat = (st, targetId, text, color, size = 20) =>
    ({ ...st, floats: [...st.floats, { key: uid(), targetId, text, color, size, t: Date.now() }] });

  // フロート自動消去(生成から1.1秒経ったものをまとめて除去。アニメ後に確実に消える)
  useEffect(() => {
    if (!g.floats || g.floats.length === 0) return;
    const id = setInterval(() => {
      setG((s) => {
        if (!s.floats || s.floats.length === 0) return s;
        const now = Date.now();
        const kept = s.floats.filter((f) => !f.t || now - f.t < 1100);
        return kept.length === s.floats.length ? s : { ...s, floats: kept };
      });
    }, 250);
    return () => clearInterval(id);
  }, [!g.floats || g.floats.length === 0]);

  /* ---------- ラン開始 ---------- */
  // chapterIdx: 0-based (0=第1章, 1=第2章, ...)
  // metaOverride: 直前に確定させたばかりの meta を使いたい場合に渡す(setMeta は非同期のため、
  // 同じクリック内で setMeta 直後に呼ぶとクロージャの meta はまだ古いまま — その回避策)。
  function startFromChapter(chapterIdx, metaOverride) {
    bumpSeq(); // 進行中の非同期シーケンスを無効化(S2-2)
    let m = metaOverride || meta;
    if (chapterIdx === 0) {
      const hints = {};
      for (const id of STAGES[0].enemies) {
        if (!(m.discovered || {})[id]) {
          const b = ENEMY_BOOK[id];
          if (b.weak.length > 0) hints[id] = { w: [b.weak[0]], r: [] };
        }
      }
      if (Object.keys(hints).length > 0) {
        m = { ...m, discovered: { ...hints, ...(m.discovered || {}) } };
        m = updateMeta(m);
      }
    }
    const eq = starterState(m, startWeapon);
    const startFloor = chapterIdx * 10 + 1;
    const base = {
      screen: "run", floor: startFloor, node: 0, nodes: floorNodes(startFloor), phase: "battle",
      player: { hp: 0, poison: 0, atkUp: 0, guard: false },
      ...eq, cds: {}, enemies: [], drops: [], logs: [], floats: [],
      pending: null, busy: false, bag: false, hitId: null, eventDone: false,
      confirm: null, full: false, lastRareSeen: 0, skillTree: false, reviveUsed: false,
      orbBagBonus: 0, orbSlotBonus: 0, orbChoice: false,
      coach: chapterIdx === 0 && (m.checkpoint || 1) === 1,
      stageIntro: chapterIdx,
    };
    base.player.hp = maxHpOf(base, m);
    // 継承品(meta.inherited)はここで消費済みにする。残しておくと、中断してタイトルへ戻り
    // 「始める」を選び直すたびに同じ継承品が何度でも手に入ってしまう(無限増殖・レアアイテムの永久複製)。
    // updateMeta を通すことで metaRef.current を即座に更新する(S-1 対策)。これを怠ると、
    // 直後に呼ぶ enterNode 内の meta 書き込みが古い meta を土台にして、今しがた消費した
    // inherited をそのまま復活させてしまう。
    m = updateMeta({ ...m, reviveUsedThisRun: false, inherited: [], everHadWeapon: true });
    clearRun(); setSavedRun(null);
    const first = enterNode(base);
    saveRun(first.floor, first.node, first.player, first.weapons, first.armor, first.inv, first.cds, first.lastRareSeen, first.orbBagBonus, first.enemies);
    // ラン開始時の装備武器を記録(武器バランス調整の参考用)
    try { first.weapons.filter(Boolean).forEach(w => window.webkit?.messageHandlers?.progress?.postMessage({ event: "weapon_run_start", weapon_type: w.type, floor: startFloor })); } catch (_) {}
    setG(first);
  }
  // チェックポイント(前回到達章)から続ける
  function startRun(metaOverride) { startFromChapter(((metaOverride || meta).checkpoint || 1) - 1, metaOverride); }

  // 冒険中(生存中)の中断データから、既踏破済みの別の章へワープする。
  // startFromChapter と違い、現在の所持品(武器・防具・袋)とHPをそのまま持ち越す
  // ("章を選ぶ"で移動しただけで全ロストするのはおかしい、という不具合の修正)。
  function warpToChapter(chapterIdx, fromRun) {
    // 同じ章へのワープは無意味な連打(足止めなしでの敵リロール)を招くだけなので何もしない。
    if (stageOf(fromRun.floor) === chapterIdx) return;
    bumpSeq(); // 進行中の非同期シーケンスを無効化(S2-2)
    const startFloor = chapterIdx * 10 + 1;
    // ワープ前に持っていた「レアまでの残り間隔」をそのまま持ち越す(ゼロにはリセットしない)。
    // ただし移動先の章のクールダウン値を上限にキャップする: これが無いと、lastRareSeen が
    // 低い/古いまま一気に深い章へ飛んだ場合に floor - lastRareSeen が異常に大きくなり、
    // ワープを繰り返すだけでレアの抽選機会を無制限に稼げてしまう(章の行き来によるレア連発の抜け道)。
    // 逆に毎回ゼロへ強制リセットすると、普段づかいでステージを行き来するだけのプレイヤーが
    // レアにほとんど遭遇できなくなってしまうため、そちらもしない。
    const destCooldown = rareCooldownOf(startFloor);
    const priorGap = Math.max(0, (fromRun.floor || 0) - (fromRun.lastRareSeen || 0));
    const cappedGap = Math.min(priorGap, destCooldown);
    const lastRareSeen = startFloor - cappedGap;
    // ITEM-04: 章クリア画面(未回収の確定ドロップがある)からワープすると、drops をそのまま
    // 空にしていたため伝説武器・苔の心臓等が二度と手に入らなくなっていた。ワープ前に
    // 通常の「全部拾う」と同じ経路(takeAllPure)で袋・装備へ退避してから移動する。
    // "clear"(章ボス)だけでなく "reward"(通常/レア敵撃破。宝樹の雫を含む)も対象にする
    // (hasUncollectedReward、実バグ発見・修正: 以前は "clear" しか見ておらず、金枝の精の
    // 宝樹の雫等がここから漏れていた)。
    const collected = (hasUncollectedReward(fromRun.rewardPhase) && fromRun.drops?.length > 0)
      ? takeAllPure({ drops: fromRun.drops, weapons: fromRun.weapons, armor: fromRun.armor, inv: fromRun.inv, player: fromRun.player, logs: [], full: false })
      : fromRun;
    const base = {
      screen: "run", floor: startFloor, node: 0, nodes: floorNodes(startFloor), phase: "battle",
      player: collected.player, weapons: padWeaponSlots(collected.weapons, metaRef.current), armor: collected.armor, inv: collected.inv,
      cds: {}, enemies: [], drops: [], logs: [], floats: [],
      pending: null, busy: false, bag: false, hitId: null, eventDone: false,
      confirm: null, full: false, lastRareSeen, skillTree: false, reviveUsed: false,
      orbBagBonus: fromRun.orbBagBonus || 0, orbSlotBonus: fromRun.orbSlotBonus || 0, orbChoice: false,
      coach: false, stageIntro: chapterIdx,
    };
    clearRun(); setSavedRun(null);
    const first = enterNode(base);
    saveRun(first.floor, first.node, first.player, first.weapons, first.armor, first.inv, first.cds, first.lastRareSeen, first.orbBagBonus, first.enemies);
    setG(first);
  }

  // A-3: タイトル画面(ラン未進行中)でスキルツリーから武器スロット拡張を買った場合、
  // buySkill の即時反映は「今アクティブなラン」にしか効かないため、保存済みの中断ランを
  // 後から再開すると武器配列が古いスロット数のまま復元されてしまう。再開時にも
  // 最新の meta に合わせてスロット数を揃える。
  function padWeaponSlots(weapons, m) {
    const want = weaponSlotsOf(m);
    if (weapons.length >= want) return weapons;
    const padded = [...weapons];
    while (padded.length < want) padded.push(null);
    return padded;
  }

  // タスクキル後の再開: 保存済みフロア状態を復元する
  function resumeRun(run) {
    bumpSeq(); // 進行中の非同期シーケンスを無効化(S2-2)
    // SAVE-06: 旧バージョンが書いた/欠損したセーブ(armor 等のフィールドが無い)を読んでも
    // 落ちないよう、以降で参照するフィールドをここで一括して既定値補完する。特に `armor` は
    // 未補完のまま渡すと maxHpOf()/armorDef() の Object.values(undefined) でクラッシュする。
    run = {
      ...run,
      weapons: run.weapons || [],
      armor: run.armor || { helm: null, armor: null, charm: null },
      inv: run.inv || [],
      player: run.player || { hp: 0, poison: 0, atkUp: 0, guard: false },
    };
    if (run.phase === "dead") {
      // タスキル後の死亡画面復元: 継承選択画面を直接表示
      const stDead = {
        screen: "run", floor: run.floor, node: 0, nodes: floorNodes(run.floor), phase: "dead",
        player: { hp: 0, poison: 0, atkUp: 0, guard: false },
        weapons: run.weapons, armor: run.armor, inv: run.inv,
        cds: {}, drops: [], logs: [], floats: [],
        pending: null, busy: false, bag: false, hitId: null, eventDone: false,
        confirm: null, full: false, lastRareSeen: 0, skillTree: false, reviveUsed: false,
        orbBagBonus: run.orbBagBonus || 0, orbSlotBonus: run.orbSlotBonus || 0, orbChoice: false,
        coach: false, stageIntro: null, enemies: [],
      };
      const effSlots = meta.slots + (run.orbSlotBonus || 0);
      setSavedRun(null);
      setG({ ...stDead, pick: recommendPick(stDead, effSlots), effSlots, rebirthStage: Math.min(meta.checkpoint || 1, 10) - 1 });
      return;
    }
    if (run.rewardPhase === "clear") {
      // タスキル後のボス撃破報酬復元: ボスを再度生成させず、章クリア画面をそのまま復元する
      // (これが無いと、確定報酬を拾う前にタスキルすると二度と手に入らなくなる。全部拾い終えた
      // 後でも、ここを経由しないと「進む」を押す前に倒したはずのボスと再戦させられてしまう)。
      const restored = {
        screen: "run", floor: run.floor, node: run.node || 0, nodes: floorNodes(run.floor), phase: "clear",
        player: run.player, weapons: padWeaponSlots(run.weapons, metaRef.current), armor: run.armor, inv: run.inv,
        cds: run.cds || {}, drops: run.drops || [], logs: [], floats: [],
        pending: null, busy: false, bag: false, hitId: null, eventDone: false,
        confirm: null, full: false, lastRareSeen: run.lastRareSeen || 0, skillTree: false, reviveUsed: false,
        orbBagBonus: run.orbBagBonus || 0, orbSlotBonus: run.orbSlotBonus || 0, orbChoice: false,
        coach: false, stageIntro: null, enemies: [],
      };
      setSavedRun(null);
      setG(restored);
      return;
    }
    if (run.rewardPhase === "reward") {
      // タスキル後の通常/レア敵撃破報酬復元(金枝の精の宝樹の雫を含む)。上と同じ理由で、
      // 敵を再生成せず戦利品画面をそのまま復元する。宝樹の雫の広告オファーは再提示しない
      // (dewAdOffer: false)— 広告視聴の成否に関わらず、この画面へ戻ってきた時点で今回の
      // 遭遇分は決着済みとして扱う(dewAdClaimed: true で以後の再提示経路も塞いでおく)。
      const restored = {
        screen: "run", floor: run.floor, node: run.node || 0, nodes: floorNodes(run.floor), phase: "reward",
        player: run.player, weapons: padWeaponSlots(run.weapons, metaRef.current), armor: run.armor, inv: run.inv,
        cds: run.cds || {}, drops: run.drops || [], logs: [], floats: [],
        pending: null, busy: false, bag: false, hitId: null, eventDone: false,
        confirm: null, full: false, lastRareSeen: run.lastRareSeen || 0, skillTree: false, reviveUsed: false,
        orbBagBonus: run.orbBagBonus || 0, orbSlotBonus: run.orbSlotBonus || 0, orbChoice: false,
        coach: false, stageIntro: null, enemies: [],
        dewAdOffer: false, dewAdClaimed: true,
      };
      setSavedRun(null);
      setG(restored);
      return;
    }
    const savedEnemies = (run.enemies || []).filter((e) => e.hp > 0);
    const base = {
      screen: "run", floor: run.floor, node: run.node || 0, nodes: floorNodes(run.floor), phase: "battle",
      player: run.player, weapons: padWeaponSlots(run.weapons, metaRef.current), armor: run.armor, inv: run.inv,
      cds: run.cds || {}, drops: [], logs: [], floats: [],
      pending: null, busy: false, bag: false, hitId: null, eventDone: false,
      confirm: null, full: false, lastRareSeen: run.lastRareSeen || 0, skillTree: false, reviveUsed: false,
      orbBagBonus: run.orbBagBonus || 0, orbSlotBonus: run.orbSlotBonus || 0, orbChoice: false,
      coach: false, stageIntro: null,
    };
    setSavedRun(null);
    if (savedEnemies.length > 0) {
      const restored = ensureWeapon({ ...base, enemies: savedEnemies });
      saveRun(restored.floor, restored.node, restored.player, restored.weapons, restored.armor, restored.inv, restored.cds, restored.lastRareSeen, restored.orbBagBonus, restored.enemies);
      setG(restored);
    } else {
      const next = enterNode(base);
      saveRun(next.floor, next.node, next.player, next.weapons, next.armor, next.inv, next.cds, next.lastRareSeen, next.orbBagBonus, next.enemies);
      setG(next);
    }
  }

  // 武器スロットが全空なら袋から最強武器を自動装備。袋にもなければ応急の短剣を拾わせる。
  function ensureWeapon(st) {
    if (st.weapons.some(Boolean)) return st;
    let s = st;
    const inBag = s.inv.filter((x) => x.kind === "weapon");
    if (inBag.length > 0) {
      const best = inBag.reduce((a, b) => (b.atk > a.atk ? b : a));
      s = { ...s, weapons: s.weapons.map((_, i) => (i === 0 ? best : null)), inv: s.inv.filter((x) => x.id !== best.id) };
      return pushLog(s, `手に武器がない……${best.name}を袋から取り出した。`);
    }
    const fallback = makeWeapon(Math.max(1, s.floor - 2), { type: "dagger", rarity: "common" });
    s = { ...s, weapons: s.weapons.map((_, i) => (i === 0 ? fallback : null)) };
    return pushLog(s, "折れかけた短剣が転がっていた。拾い上げて握りしめる……", true);
  }

  function enterNode(st) {
    const kind = st.nodes[st.node];
    let s = { ...st, pending: null, drops: [], eventDone: false, dewAdClaimed: false, dewAdOffer: false };
    if (kind === "battle" || kind === "boss") {
      s = ensureWeapon(s);
      s.phase = "battle";
      const lastRare = s.lastRareSeen || 0;
      const rareChance = meta ? rareChanceOf(meta, s.floor) : 0.04 + stageOf(s.floor) * 0.02;
      s.enemies = kind === "boss" ? [makeBoss(s.floor)] : enemiesForEncounter(s.floor, lastRare, rareChance);
      if (kind !== "boss" && s.enemies.some((e) => e.rare)) s = { ...s, lastRareSeen: s.floor };
      // 遭遇した敵を図鑑に記録(S-1: 必ず metaRef.current を土台にする。ここで stale な
      // meta クロージャを土台にすると、直前に startFromChapter が確定させた inherited:[] 等の
      // 更新をこの書き込みが丸ごと上書きし、消費済みの継承品を復活させてしまう)。
      { const mNow = metaRef.current; const ns = { ...(mNow.seen || {}) }; let ch = false;
        for (const e of s.enemies) { if (e.bookId && !ns[e.bookId]) { ns[e.bookId] = true; ch = true; } }
        if (ch) updateMeta({ seen: ns }); }
      s.cds = {};
      s.turn = 1;
      s = pushLog(s, "【戦闘開始】", true);
      s = pushLog(s, `── ターン${s.turn} ──`, true);
      // 呼吸法・再生の心得: 戦闘開始時にHPを回復
      const battleStartHealPct = skillEffectTotal(meta?.skills, "battleStartHealPct");
      if (battleStartHealPct > 0 && s.player.hp > 0) {
        const mx = maxHpOf(s);
        const heal = Math.round(mx * battleStartHealPct);
        if (heal > 0 && s.player.hp < mx) {
          s.player = { ...s.player, hp: Math.min(mx, s.player.hp + heal) };
          s = pushLog(s, `呼吸を整え、HPを${heal}回復した`);
        }
      }
      s = pushLog(s, kind === "boss" ? `──${STAGES[stageOf(s.floor)].boss.name}が立ちはだかる。` : "敵が現れた。", kind === "boss");
      if (s.enemies.some((e) => e.rare)) s = pushLog(s, "……金色の光。金枝の精が紛れている!", true);
    } else {
      s.phase = kind; // chest / spring
    }
    return s;
  }

  function nextNode(st) {
    let s = { ...st };
    if (s.node + 1 < s.nodes.length) {
      s.node += 1;
      const next = enterNode(s);
      saveRun(next.floor, next.node, next.player, next.weapons, next.armor, next.inv, next.cds, next.lastRareSeen, next.orbBagBonus, next.enemies);
      return next;
    }
    // 次の階へ
    const nf = s.floor + 1;
    if (nf > 100) return s; // 100層クリアはボス撃破側で処理
    s.floor = nf; s.node = 0; s.nodes = floorNodes(nf);
    if (floorInStage(nf) === 1) {
      s.stageIntro = stageOf(nf); // 新章に入ったらタイトル演出を挟む
      s = pushLog(s, `第${stageOf(nf) + 1}章「${STAGES[stageOf(nf)].name}」に足を踏み入れた。`, true);
    } else {
      s = pushLog(s, `第 ${floorLabel(nf)} 層へ降りた。霧が濃くなる……`);
    }
    const next = enterNode(s);
    saveRun(next.floor, next.node, next.player, next.weapons, next.armor, next.inv, next.cds, next.lastRareSeen, next.orbBagBonus, next.enemies);
    return next;
  }

  /* ---------- ダメージ計算 ---------- */
  function hitEnemy(st, enemy, rawAtk, dmgType, mult, discovered) {
    let aff = 1, tag = null;
    if (enemy.weak.includes(dmgType)) { aff = AFF_WEAK; tag = "weak"; }
    else if (enemy.resist.includes(dmgType)) { aff = AFF_RES; tag = "res"; }
    const dmg = Math.max(1, Math.round(rawAtk * mult * aff * rnd(0.9, 1.1)) - enemy.def);
    enemy.hp = Math.max(0, enemy.hp - dmg);
    // 弱点・耐性の発見を記録
    if (tag && enemy.bookId) {
      const d = discovered[enemy.bookId] || (discovered[enemy.bookId] = { w: [], r: [] });
      const list = tag === "weak" ? d.w : d.r;
      if (!list.includes(dmgType)) list.push(dmgType);
    }
    return { dmg, tag };
  }

  /* ---------- プレイヤーの攻撃 ---------- */
  async function attackWith(weapon, targetId) {
    const st0 = gRef.current;
    if (st0.busy || st0.phase !== "battle") return;
    playAttackSound();
    const t = WEAPON_TYPES[weapon.type];
    let s = { ...st0, pending: null, busy: true };
    const enemies = s.enemies.map((e) => ({ ...e }));
    const discovered = JSON.parse(JSON.stringify(meta.discovered || {}));
    const atkMul = (s.player.atkUp > 0 ? 1.4 : 1);
    // 属性ごとの心得・極意・真髄が積み上がる(この属性のものだけ合計)。
    const masteryMult = 1 + skillEffectTotal(meta?.skills, "elementDmgPct", (e) => e.element === t.dmgType);
    const powerSealMult = 1 + skillEffectTotal(meta?.skills, "allDmgPct");
    const raw = weapon.atk * atkMul * masteryMult * powerSealMult;
    // A-1: elementDmgPct と同じく、この武器の属性の余韻だけを合計する(フィルタ漏れで
    // 以前は全属性の余韻(5種合計20%)が常に乗ってしまっていた)。
    const lifestealPct = skillEffectTotal(meta?.skills, "lifestealPct", (e) => e.element === t.dmgType);
    let dmgDealtThisAction = 0;
    const target = enemies.find((e) => e.id === targetId && e.hp > 0) || enemies.find((e) => e.hp > 0);
    if (!target) return;
    const floats = [];
    // フロートの数字は1.1秒で消えてしまうため(kwRise)、戦闘ログにも残す。
    const hitLogs = [];
    const extraLogs = [];
    const nameOf = (eid) => enemies.find((x) => x.id === eid)?.name || "敵";
    const F = (eid, r) => {
      const label = r.tag === "weak" ? `弱点 ${r.dmg}` : r.tag === "res" ? `耐性 ${r.dmg}` : `${r.dmg}`;
      const color = r.tag === "weak" ? "var(--hotaru)" : r.tag === "res" ? "var(--paper-dim)" : "var(--paper)";
      floats.push({ key: uid(), targetId: eid, text: label, color, size: r.tag === "weak" ? 24 : 19, t: Date.now() });
      hitLogs.push(`${nameOf(eid)}に${r.dmg}ダメージを与えた${r.tag === "weak" ? "(弱点)" : r.tag === "res" ? "(耐性)" : ""}`);
    };

    if (weapon.type === "dagger") {
      const critChance = 0.25 + skillEffectTotal(meta?.skills, "critChancePct");
      for (let i = 0; i < 2; i++) {
        if (target.hp <= 0) break;
        const crit = Math.random() < critChance;
        const r = hitEnemy(s, target, raw, t.dmgType, crit ? 1.8 : 1, discovered);
        dmgDealtThisAction += r.dmg;
        if (crit) {
          const label = `会心 ${r.dmg}`;
          floats.push({ key: uid(), targetId: target.id, text: label, color: "var(--hotaru)", size: 24, t: Date.now() });
          hitLogs.push(`${target.name}に${r.dmg}ダメージを与えた(会心)`);
        } else {
          F(target.id, r);
        }
      }
      s = pushLog(s, `${weapon.name}の二連撃。`);
    } else if (weapon.type === "greatsword") {
      const r = hitEnemy(s, target, raw, t.dmgType, 2.2, discovered); F(target.id, r); dmgDealtThisAction += r.dmg;
      s = pushLog(s, `${weapon.name}を振り抜いた!`);
    } else if (weapon.type === "bow") {
      const r = hitEnemy(s, target, raw, t.dmgType, 1, discovered); F(target.id, r); dmgDealtThisAction += r.dmg;
      const others = enemies.filter((e) => e.hp > 0 && e.id !== target.id);
      if (others.length) { const o = pick(others); const r2 = hitEnemy(s, o, raw, t.dmgType, 0.5, discovered); F(o.id, r2); dmgDealtThisAction += r2.dmg; }
      s = pushLog(s, `${weapon.name}で射抜き、流れ矢が走る。`);
    } else if (weapon.type === "axe") {
      const r = hitEnemy(s, target, raw, t.dmgType, 1.6, discovered); F(target.id, r); dmgDealtThisAction += r.dmg;
      target.def = Math.max(0, target.def - 2);
      floats.push({ key: uid(), targetId: target.id, text: "防御破壊", color: "var(--mist)", size: 13, t: Date.now() });
      s = pushLog(s, `${weapon.name}が守りを砕く。`);
    } else if (weapon.type === "spear") {
      const idx = enemies.findIndex((e) => e.id === target.id);
      const r = hitEnemy(s, target, raw, t.dmgType, 1.1, discovered); F(target.id, r); dmgDealtThisAction += r.dmg;
      const behind = enemies.slice(idx + 1).find((e) => e.hp > 0);
      if (behind) { const r2 = hitEnemy(s, behind, raw, t.dmgType, 0.7, discovered); F(behind.id, r2); dmgDealtThisAction += r2.dmg; }
      s = pushLog(s, `${weapon.name}の貫きが奥まで届く。`);
    } else if (weapon.type === "book") {
      for (const e of enemies) if (e.hp > 0) { const r = hitEnemy(s, e, raw, t.dmgType, 1.0, discovered); F(e.id, r); dmgDealtThisAction += r.dmg; }
      s = pushLog(s, `${weapon.name}の一節が森を薙ぐ。`);
    } else if (weapon.type === "staff") {
      const r = hitEnemy(s, target, raw, t.dmgType, 1.4, discovered); F(target.id, r); dmgDealtThisAction += r.dmg;
      const heal = Math.round(maxHpOf(s) * 0.1);
      s.player = { ...s.player, hp: Math.min(maxHpOf(s), s.player.hp + heal) };
      floats.push({ key: uid(), targetId: "player", text: `+${heal}`, color: "#8fd39a", size: 18, t: Date.now() });
      s = pushLog(s, `${weapon.name}の光が敵を打ち、身体を癒す。`);
      extraLogs.push(`HPを${heal}回復した`);
    } else if (weapon.type === "instrument") {
      for (const e of enemies) if (e.hp > 0) {
        const r = hitEnemy(s, e, raw, t.dmgType, 1.0, discovered); F(e.id, r); dmgDealtThisAction += r.dmg;
        e.atkDown = 2 + skillEffectTotal(meta?.skills, "instrumentDebuffTurns");
      }
      s = pushLog(s, `${weapon.name}の旋律が敵を怯ませる(攻撃弱体)。`);
    }

    for (const t of [...hitLogs, ...extraLogs]) s = pushLog(s, t);

    // 余韻(ライフスティール): 与えたダメージの一部を吸収する。
    if (lifestealPct > 0 && dmgDealtThisAction > 0) {
      const mx = maxHpOf(s);
      const heal = Math.round(dmgDealtThisAction * lifestealPct);
      if (heal > 0 && s.player.hp < mx) {
        s.player = { ...s.player, hp: Math.min(mx, s.player.hp + heal) };
        floats.push({ key: uid(), targetId: "player", text: `+${heal}`, color: "#8fd39a", size: 15, t: Date.now() });
        s = pushLog(s, `余韻でHPを${heal}回復した`);
      }
    }

    if (t.cd > 0) s.cds = { ...s.cds, [weapon.id]: t.cd + 1 }; // このターン終了時に-1される
    s.enemies = enemies;
    s.floats = [...s.floats, ...floats];
    s.hitId = target.id;
    // 攻撃が成立したここで世代を進める(!target 等の早期 return では進めない・S2-2 回帰対策)
    const mySeq = ++seqRef.current;
    setG(s);
    // 発見情報を保存(S-1: metaRef.current を土台にする。この関数が始まった時点の meta
    // クロージャは、戦闘中に別経路で更新された可能性のある最新の meta を反映していないため)。
    updateMeta({ discovered });
    await sleep(650);
    // stalled(長時間中断)では打ち切らない: afterPlayerAction は常に gRef.current を
    // 再読込してから進むので、バックグラウンドを挟んでも安全に敵ターンへ進める。
    // ここで打ち切ると「攻撃/道具/防御の直後に一瞬バックグラウンドへ切り替えて戻す」だけで
    // 敵の反撃を丸ごとスキップできてしまう(無敵回復の抜け道)。新しい行動で世代が進んだ
    // 場合(seqRef.current !== mySeq)だけを古い継続として破棄する。
    if (seqRef.current !== mySeq) return;
    await afterPlayerAction(mySeq);
  }

  /* ---------- 道具を使う(戦闘中はターン消費) ----------
     前提判定・状態組み立て・ターン進行はすべて gRef.current から同期的に行う。
     setG(updater) の updater は React 18 で後回しになりうるため、「適用できたか」を
     updater の副作用で判定すると敵ターン処理が飛ぶことがある(そのため関数型更新は使わない)。
     その代わり、setG(素の値) の直後に gRef.current 自身もその値へ同期的に合わせておく
     (同じレンダー内で React が追従するのを待たない)。こうすることで、同一ティック内で
     別のアイテムが連続してタップされても(例: 2つの苔の心臓をほぼ同時に使う)、後続の
     呼び出しは必ず直前の呼び出しが確定させた最新状態を見てから判定できる。
     以前は gRef.current の更新を次のレンダーまで待っていたため、異なる2つのアイテムを
     ほぼ同時にタップすると両方が同じ古いスナップショットを見て計算し、setG(素の値) が
     後勝ちで上書きして片方の消費(袋からの削除・苔の心臓の永続HP増加など)が黙って
     消えることがあった。 */
  async function useItem(item) {
    const st0 = gRef.current;
    // 章開始直後の戦闘準備(gearPrep)は、戦闘後と同じ扱い(ターンを消費せず、敵も動かない)。
    const inBattle = st0.phase === "battle" && !st0.gearPrep;
    if (inBattle && st0.busy) return;
    const c = CONSUMABLES[item.itemId];
    if (!c) return;
    if (c.kind === "bomb" && !inBattle) return; // 森火の実は戦闘中のみ
    // 二重適用・多重タップ防止: すでに袋から消えているアイテムは無視する
    if (!st0.inv.some((x) => x.id === item.id)) return;

    const mySeq = ++seqRef.current;

    const before = { hp: st0.player.hp, poison: st0.player.poison || 0, inv: st0.inv.length, atkUp: st0.player.atkUp || 0 };
    // 戦闘中はアイテム使用で袋を即閉じる(敵ターンの演出を隠さない)。
    // 戦闘後(報酬画面等)は従来どおり明示的に閉じるまで開いたまま。
    let s = { ...st0, busy: inBattle, bag: inBattle ? false : st0.bag };
    // 宝樹の雫(orb)は「継承枠/精の結晶のどちらかを選ぶまで」袋から消さない。
    // ここで先に消してしまうと、選択画面が出た直後にアプリを終了して再開した場合、
    // 雫だけ消えて報酬(枠も結晶も)が一切もらえない事態になる(resolveOrbChoice で確定消費する)。
    if (c.kind !== "orb") {
      s.inv = s.inv.filter((x) => x.id !== item.id);
    }
    const mx = maxHpOf(s);
    let gainedMetaHp = false; // 苔の心臓: 確定後に meta へ適用
    if (c.kind === "heal") {
      const heal = Math.round(mx * c.power);
      s.player = { ...s.player, hp: Math.min(mx, s.player.hp + heal) };
      s = addFloat(s, "player", `+${heal}`, "#8fd39a", 20);
      s = pushLog(s, `${c.label}を口にした。HPを${heal}回復した`);
    } else if (c.kind === "cure") {
      const heal = Math.round(mx * c.power);
      s.player = { ...s.player, poison: 0, hp: Math.min(mx, s.player.hp + heal) };
      s = addFloat(s, "player", `+${heal}`, "#8fd39a", 20);
      s = pushLog(s, `${c.label}で毒が消えた。HPを${heal}回復した`);
    } else if (c.kind === "buff") {
      s.player = { ...s.player, atkUp: c.turns + (inBattle ? 1 : 0) };
      s = pushLog(s, `${c.label}が全身を巡る。攻撃+40%!`, true);
    } else if (c.kind === "bomb" && inBattle) {
      const power = bombPowerAt(s.floor); // 深い階ほど強力
      const enemies = s.enemies.map((e) => ({ ...e }));
      for (const e of enemies) if (e.hp > 0) {
        e.hp = Math.max(0, e.hp - power);
        s = addFloat(s, e.id, `${power}`, "#f0946a", 22);
      }
      s.enemies = enemies;
      s = pushLog(s, `${c.label}が弾け、火の粉が敵を包む!`, true);
    } else if (c.kind === "metaHp") {
      gainedMetaHp = true;
      s.player = { ...s.player, hp: s.player.hp + 6 };
      s = pushLog(s, `苔の心臓が鼓動する……最大HPが永続+6。`, true);
    } else if (c.kind === "orb") {
      s = { ...s, orbChoice: true, busy: false };
    } else {
      s.busy = false;
    }

    setG(s);
    gRef.current = s; // 同一ティック内の連続呼び出しに備え、ref も即座に最新化する

    // --- 副作用 ---
    if (gainedMetaHp) {
      // updateMeta は常に metaRef.current を土台にする(S-1 と同じ仕組み)ため、2つの
      // 苔の心臓をほぼ同時に使った場合でも、両方の +6 が正しく積み上がる(以前は古い
      // metaRef.current を両方が見て、後勝ちの setMeta が上書きし +12 のはずが +6 のまま
      // 失われていた)。
      updateMeta((m) => ({ ...m, bonusHp: (m?.bonusHp || 0) + 6 }));
    }
    flushSaveRun(s); // アイテム使用結果を永続化(S2-3)

    try {
      const after = { hp: s.player.hp, poison: s.player.poison || 0, inv: s.inv.length };
      window.webkit?.messageHandlers?.progress?.postMessage({
        event: "item_use", itemId: item.itemId, phase: s.phase, busy: !!s.busy,
        hpBefore: before.hp, hpAfter: after.hp,
        poisonBefore: before.poison, poisonAfter: after.poison,
        invBefore: before.inv, invAfter: after.inv,
        applied: (after.hp !== before.hp) || (after.poison !== before.poison)
          || ((s.player.atkUp || 0) !== before.atkUp)
          || s.orbChoice === true || gainedMetaHp,
        resumed: false,
      });
    } catch (_) {}

    // 戦闘中でターンを消費するアイテム(busy=true)なら、敵ターン → 自分のターンへ進める。
    // stalled(長時間中断)では打ち切らない(理由は attackWith と同じ。無敵回復の抜け道対策)。
    if (s.busy && s.phase === "battle") {
      await sleep(450);
      if (seqRef.current !== mySeq) return;
      await afterPlayerAction(mySeq);
    }
  }

  async function guard() {
    const st0 = gRef.current;
    if (st0.busy || st0.phase !== "battle") return;
    const mySeq = ++seqRef.current;
    let s = { ...st0, busy: true, pending: null };
    s.player = { ...s.player, guard: true, hp: Math.min(maxHpOf(s), s.player.hp + Math.round(maxHpOf(s) * 0.05)) };
    s = pushLog(s, "身を低くして構えた(被ダメージ半減)。");
    setG(s);
    await sleep(450);
    if (seqRef.current !== mySeq) return; // stalled では打ち切らない(無敵回復の抜け道対策)
    await afterPlayerAction(mySeq);
  }

  /* ---------- 行動後処理 → 敵ターン ---------- */
  async function afterPlayerAction(seq) {
    if (seq != null && seqRef.current !== seq) return;
    let st = gRef.current;
    // 撃破判定
    const killed = st.enemies.filter((e) => e.hp <= 0 && !e.counted);
    if (killed.length) {
      let committed = null;
      setG((s) => {
        let ns = { ...s, enemies: s.enemies.map((e) => e.hp <= 0 ? { ...e, counted: true } : e) };
        for (const k of killed) {
          if (k.rare) ns = pushLog(ns, `${k.name}を捕まえた! まばゆい光が零れ落ちる。`, true);
          else if (k.boss) ns = pushLog(ns, `${k.name}は静かに膝を折り、森に還っていく……`, true);
          else ns = pushLog(ns, `${k.name}を倒した。`);
        }
        committed = ns;
        return ns;
      });
      st = committed || st;
      await sleep(420);
      // stalled では打ち切らない(無敵回復の抜け道対策。理由は attackWith と同じ)
      if (seq != null && seqRef.current !== seq) return;
      st = gRef.current;
    }
    const alive = st.enemies.filter((e) => e.hp > 0);
    if (alive.length === 0) return battleWon(killedAll(st), seq);
    // 敵ターン
    await enemyPhase(seq);
  }
  const killedAll = (st) => st.enemies;

  function rollDrops(enemies, floor, inv) {
    const drops = [];
    const dropLuck = skillEffectTotal(meta?.skills, "dropLuck");
    for (const e of enemies) {
      if (e.rare) {
        drops.push(makeConsumable("dew"));
        drops.push(makeWeapon(floor, { rarity: Math.random() < 0.3 ? "legend" : "epic" }));
        continue;
      }
      if (e.boss) {
        // ステージごとに1回だけドロップ(mossHeartStagesに章インデックスが記録されたら二度と出ない)
        const sIdx = stageOf(floor);
        if (!(meta.mossHeartStages || []).includes(sIdx)) drops.push(makeConsumable("mossHeart"));
        drops.push(makeWeapon(floor, { rarity: "legend" }));
        drops.push(makeArmor(floor, { rarity: "epic" }));
        continue;
      }
      const roll = Math.random();
      const wMax = floor <= 10 ? 0.64 : 0.62; // 第1章は武器ドロップ率アップ
      if (roll < 0.38) drops.push(makeConsumable(null, floor));
      else if (roll < wMax) drops.push(makeWeapon(floor, { luck: dropLuck }));
      else if (roll < wMax + 0.12) drops.push(makeArmor(floor, { luck: dropLuck }));
    }
    if (drops.length === 0) drops.push(makeConsumable(null, floor));
    return drops;
  }

  async function battleWon(enemies, seq) {
    // 勝利は必ず完遂させる(途中の await は localStorage 保存のみ)。seq は経緯確認用。
    const st = gRef.current;
    const isBoss = enemies.some((e) => e.boss);
    const drops = rollDrops(enemies.filter((e) => e.hp <= 0 && !e.fled), st.floor, st.inv);
    const dewAdOffer = drops.some((d) => d.itemId === "dew") && rewardAdUsesLeft(meta) > 0 && !st.dewAdClaimed;
    let s = { ...st, busy: false, phase: "reward", drops, dewAdOffer };
    s.player = { ...s.player, guard: false };
    if (isBoss) {
      const stage = stageOf(st.floor) + 1; // 1..10
      const sIdx = stage - 1;
      const clearsBefore = metaRef.current.clears; // レビュー促し判定用(更新前の値が必要)
      const checkpointBefore = metaRef.current.checkpoint || 1;
      if (stage >= 10) {
        // 百層踏破 — エンディング。所持品は全て次の生へ持ち越せるが、次の生が実際に
        // 保持できる上限(武器スロット+防具3+袋の最大数)は超えられないため、価値の高い順に切り詰める。
        // ボス討伐自体では継承枠を増やさない(継承枠は宝樹の雫を変換した時だけ増える)ため、
        // 容量計算は現在の m.slots をそのまま使う。
        const m2 = updateMeta((m) => {
          const mhStages = drops.some((d) => d.itemId === "mossHeart")
            ? [...(m.mossHeartStages || []), sIdx]
            : (m.mossHeartStages || []);
          const capacity = weaponSlotsOf(m) + 3 + invCapOf(m);
          const keep = [...s.weapons.filter(Boolean), ...Object.values(s.armor).filter(Boolean), ...s.inv, ...drops]
            .sort((a, b) => itemScore(b) - itemScore(a))
            .slice(0, capacity);
          // checkpoint もここでリセットしておく(エンディング画面でタスキルされても、
          // 継承品と一緒に「次は1章から」が確定した状態になり、章が巻き戻らない)。
          return { ...m, mossHeartStages: mhStages, clears: m.clears + 1, bestFloor: 100, inherited: keep, checkpoint: 1 };
        });
        s.phase = "ending";
        // 進行度をFirebaseに記録(全章踏破)
        try { window.webkit?.messageHandlers?.progress?.postMessage({ event: "game_clear", clears: m2.clears }); } catch (_) {}
        // 初回全章踏破でレビューを促す
        if (clearsBefore === 0) {
          try { window.webkit?.messageHandlers?.requestReview?.postMessage(null); } catch (_) {}
        }
      } else {
        // 章クリア: 次章から再出発できるようになる。継承枠は増やさない
        // (継承枠は宝樹の雫を変換した時だけ増える別の進行経路にする)。
        const m2 = updateMeta((m) => {
          const mhStages = drops.some((d) => d.itemId === "mossHeart")
            ? [...(m.mossHeartStages || []), sIdx]
            : (m.mossHeartStages || []);
          return {
            ...m, mossHeartStages: mhStages,
            bestFloor: Math.max(m.bestFloor, st.floor),
            checkpoint: Math.max(m.checkpoint || 1, stage + 1),
          };
        });
        s.phase = "clear";
        // 進行度をFirebaseに記録(章クリア=到達点更新)
        try { window.webkit?.messageHandlers?.progress?.postMessage({ event: "stage_clear", stage, checkpoint: m2.checkpoint }); } catch (_) {}
        // ボス撃破時の装備武器を記録(武器バランス調整の参考用)
        try { s.weapons.filter(Boolean).forEach(w => window.webkit?.messageHandlers?.progress?.postMessage({ event: "weapon_boss_kill", weapon_type: w.type, stage })); } catch (_) {}
        // 第2・3章ボス初クリア時にレビューを促す
        if ((stage === 2 || stage === 3) && checkpointBefore <= stage) {
          try { window.webkit?.messageHandlers?.requestReview?.postMessage(null); } catch (_) {}
        }
      }
    }
    setG(s);
    // タスキル対策: 勝利後に即セーブ
    if (s.phase === "ending") {
      clearRun(); // 100層踏破完了、ランデータをクリア
    } else if (s.phase === "clear") {
      // ボスクリア: 未回収の確定ドロップ(伝説武器・苔の心臓等)を保持したまま保存する。
      // ここで次の階へ進めてしまうと、拾う前にタスキルされた場合に一度きりの報酬が消える。
      saveRun(s.floor, s.node, s.player, s.weapons, s.armor, s.inv, {}, s.lastRareSeen, s.orbBagBonus, null, "clear", s.drops);
    } else {
      // 通常戦闘の勝利(敵なし): 未回収の確定ドロップ(金枝の精の宝樹の雫等)を保持したまま
      // 保存する。以前はここで drops を渡していなかったため、雫の広告視聴〜「拾う」を押す
      // までの間にタスキルすると、戦利品(広告で増えた分も含め未回収分)が丸ごと消えていた
      // (実バグ発見・修正)。
      saveRun(s.floor, s.node, s.player, s.weapons, s.armor, s.inv, s.cds, s.lastRareSeen, s.orbBagBonus, null, "reward", s.drops);
    }
  }

  // 死亡確定処理(復活オファーを断った/広告に失敗した場合もここを通る)
  function finalizeDeath(stFainted) {
    bumpSeq(); // 進行中の非同期シーケンスを無効化(S2-2)
    const m2 = updateMeta((m) => ({ ...m, deaths: m.deaths + 1, bestFloor: Math.max(m.bestFloor, stFainted.floor) }));
    // 進行度をFirebaseに記録(死亡=到達フロア)
    try { window.webkit?.messageHandlers?.progress?.postMessage({ event: "death", floor: stFainted.floor, bestFloor: m2.bestFloor }); } catch (_) {}
    // 死亡時は継承選択のためデータを保持（タスキル後も死亡画面を復元できるよう）
    saveDeadRun(stFainted.floor, stFainted.weapons, stFainted.armor, stFainted.inv, stFainted.orbBagBonus || 0, stFainted.orbSlotBonus || 0);
    setSavedRun(null);
    const effSlots = m2.slots + (stFainted.orbSlotBonus || 0);
    setG({ ...stFainted, phase: "dead", pick: recommendPick(stFainted, effSlots), effSlots, rebirthStage: Math.min(m2.checkpoint || 1, 10) - 1 });
  }

  /* ---------- 敵の行動 ---------- */
  async function enemyPhase(seq) {
    if (seq != null && seqRef.current !== seq) return;
    let s = { ...gRef.current };
    let enemies = s.enemies.map((e) => ({ ...e }));
    let player = { ...s.player };
    const mx = maxHpOf(s);
    const def = armorDef(s);
    const dodgeChance = skillEffectTotal(meta?.skills, "dodgeChancePct");
    const poisonImmune = skillEffectTotal(meta?.skills, "poisonImmune") > 0;

    const n0 = enemies.length; // このターン開始時にいた敵だけ行動(召喚された敵は次ターンから)
    for (let i = 0; i < n0; i++) {
      const e = enemies[i];
      if (!e || e.hp <= 0) continue;
      if (player.hp <= 0) break;
      // 金枝の精: 攻撃せず、時間切れで消える
      if (e.rare) {
        e.fleeIn -= 1;
        if (e.fleeIn <= 0) { e.hp = 0; e.counted = true; e.fled = true; s = pushLog(s, `${e.name}は森の奥へ消えてしまった……`); }
        else s = pushLog(s, `${e.name}は揺らめいている(あと${e.fleeIn}ターン)。`);
        continue;
      }
      const weaken = e.atkDown > 0 ? 0.8 : 1;
      let dmg = Math.max(1, Math.round(e.atk * weaken * rnd(0.9, 1.1)) - def);
      // ボスの行動パターン(章ごとに眷属とセリフが変わる)
      if (e.boss) {
        const maxSummons = e.final ? 2 : 1;
        const done = e.summoned || 0;
        if (e.hp < e.maxHp * (done === 0 ? 0.55 : 0.25) && done < maxSummons && enemies.filter((x) => x.hp > 0).length < 3) {
          e.summoned = done + 1;
          const kids = e.summons.map((id) => makeEnemy(id, s.floor));
          enemies = [...enemies, ...kids];
          s = pushLog(s, e.summonLine, true);
          continue;
        }
        if (e.charge) { dmg = Math.max(1, dmg * 2); e.charge = false; s = pushLog(s, e.bigLine, true); }
        else if (Math.random() < 0.28) { e.charge = true; s = pushLog(s, `${e.chargeLine}(次は大技)`, true); continue; }
      }
      if (player.guard) dmg = Math.max(1, Math.round(dmg / 2));
      // 健脚/疾風の心得: 完全回避
      const dodged = dodgeChance > 0 && Math.random() < dodgeChance;
      if (dodged) {
        dmg = 0;
        s = { ...s, floats: [...s.floats, { key: uid(), targetId: "player", text: "回避!", color: "#8fd39a", size: 18, t: Date.now() }] };
        s = pushLog(s, `${e.name}の攻撃。回避!`);
      } else {
        // 不屈の心得: 残りHPが最大値の25%以下のとき被ダメージ軽減
        const lowHpCut = skillEffectTotal(meta?.skills, "lowHpDmgReduction", (eff) => player.hp <= mx * (eff.threshold ?? 0.25));
        if (lowHpCut > 0) dmg = Math.max(1, Math.round(dmg * (1 - lowHpCut)));
        s = { ...s, floats: [...s.floats, { key: uid(), targetId: "player", text: `${dmg}`, color: "var(--danger)", size: 20, t: Date.now() }] };
        // 敵ごとのダメージをログに残す(フロートは1.1秒で消えるため)。
        s = pushLog(s, `${e.name}から${dmg}ダメージを受けた`);
      }
      player.hp = Math.max(0, player.hp - dmg);
      // 吸収(与ダメの半分を回復)
      if (e.drain && dmg > 0) {
        const rec = Math.round(dmg / 2);
        e.hp = Math.min(e.maxHp, e.hp + rec);
        s = { ...s, floats: [...s.floats, { key: uid(), targetId: e.id, text: `回復 ${rec}`, color: "#8fd39a", size: 15, t: Date.now() }] };
        s = pushLog(s, `${e.name}が傷を吸収し、HPを${rec}回復した`);
      }
      // 毒攻撃
      if (e.poison && !poisonImmune && Math.random() < 0.4 && player.poison <= 0) {
        player.poison = 3;
        s = pushLog(s, `${e.name}の毒! 身体が痺れていく。`);
      }
      if (e.atkDown > 0) e.atkDown -= 1;
      setG({ ...s, enemies, player });
      await sleep(380);
      // stalled では打ち切らない: このループは常に gRef.current を再読込してから続けるので、
      // バックグラウンドを挟んでも安全に再開できる(無敵回復の抜け道対策。他の関数と同じ理由)。
      if (seq != null && seqRef.current !== seq) return;
      s = gRef.current; enemies = s.enemies.map((x) => ({ ...x })); player = { ...s.player };
    }

    // 毒・持続効果の処理
    if (player.hp > 0 && player.poison > 0) {
      const p = Math.max(2, Math.round(mx * 0.06));
      player.hp = Math.max(0, player.hp - p);
      player.poison -= 1;
      s = { ...s, floats: [...s.floats, { key: uid(), targetId: "player", text: `-${p}`, color: "#a98ad9", size: 16, t: Date.now() }] };
      s = pushLog(s, `毒で${p}ダメージを受けた`);
    }
    if (player.atkUp > 0) player.atkUp -= 1;
    player.guard = false;
    // クールダウン減少
    const cds = {};
    for (const [k, v] of Object.entries(s.cds)) if (v - 1 > 0) cds[k] = v - 1;

    if (player.hp <= 0) {
      const stFainted = { ...s, enemies, player, cds, busy: false };
      // 広告視聴の残り回数があれば、死亡確定前に復活オファーを挟む
      if (rewardAdUsesLeft(meta) > 0 && !stFainted.reviveUsed && !meta.reviveUsedThisRun) {
        setG({ ...stFainted, phase: "reviveOffer" });
        return;
      }
      finalizeDeath(stFainted);
      return;
    }
    const finalState = { ...s, enemies, player, cds, busy: false };
    // BTL-08: 金枝の精(レア)が「最後の1体」として時間切れで消えた(fled)場合、
    // この敵ターン(enemyPhase)の中で hp=0 になるため、次の攻撃時にしか働かない
    // afterPlayerAction の alive.length===0 判定を経由できず、以前は reward 画面へ
    // 遷移せずそのまま battle 画面に取り残されていた(攻撃対象がいないソフトロック)。
    // battleWon() は gRef.current を読むため、setG で確定させてから一呼吸置く
    // (afterPlayerAction が撃破時に行っているのと同じ手当て)。
    if (enemies.every((e) => e.hp <= 0)) {
      setG(finalState);
      await sleep(420);
      if (seq != null && seqRef.current !== seq) return;
      return battleWon(enemies, seq);
    }
    // 戦闘が続く場合のみターンを進め、ログに区切りを残す(勝敗が決まる時は不要)。
    const nextTurn = (finalState.turn || 1) + 1;
    const turnState = pushLog({ ...finalState, turn: nextTurn }, `── ターン${nextTurn} ──`, true);
    setG(turnState);
    saveRun(turnState.floor, turnState.node, turnState.player, turnState.weapons, turnState.armor, turnState.inv, turnState.cds, turnState.lastRareSeen, turnState.orbBagBonus, turnState.enemies);
  }

  /* ---------- アイテムのロック / 保護 ---------- */
  const isRareItem = (it) => !!it && it.rarity && it.rarity !== "common"; // 捨てる確認ダイアログ用(従来通り)
  // 保護設定(isHealItem/isHighValueItem)はアイテムが袋へ入る瞬間の自動ロックだけに使う
  // (autoLockItem/autoLockAll/autoLockArmor、モジュール先頭で定義)。捨てる操作のブロックは
  // 統合後は常に実体の .locked 一本で判定する — 解除は鍵アイコンでのみ行える。
  const isItemProtected = (it) => !!it?.locked;

  // 個別アイテムのロックを切り替える(袋・装備中の武器/防具すべてを対象に)。
  // 前提判定・状態組み立てはすべて gRef.current から同期的に行う(useItem/resolveOrbChoice と
  // 同じ理由: setG(updater) の updater 内で確定させた値を直後の副作用側で読もうとすると、
  // React 18 では updater が後回しになることがあり、この保存処理そのものが一度も呼ばれなくなる
  // ―― 実際にこのプロジェクトで、装備・捨てる・ロック・拾うのいずれも「直後に何もしなければ
  // 保存が一度も走らない」形で発生していた実例)。
  function toggleLock(item) {
    const s0 = gRef.current;
    const flip = (x) => (x && x.id === item.id ? { ...x, locked: !x.locked } : x);
    const ns = {
      ...s0,
      inv: s0.inv.map(flip),
      weapons: s0.weapons.map(flip),
      armor: Object.fromEntries(Object.entries(s0.armor).map(([k, v]) => [k, flip(v)])),
    };
    setG(ns);
    scheduleSaveRun(ns);
  }

  /* ---------- 装備・袋 ---------- */
  function equipItem(item) {
    const s0 = gRef.current;
    // 多重タップでの二重装備を防ぐ: 既に袋から消えている(=別の呼び出しで装備済み)なら何もしない。
    // これが無いと、連打で同じアイテムが「装備中」と「袋の中」の両方に同時に存在してしまう
    // (見た目上の複製。防具なら HP ボーナスも二重に乗る)。
    if (!s0.inv.some((x) => x.id === item.id)) return;
    let ns = { ...s0 };
    if (item.kind === "weapon") {
      const idx = ns.weapons.findIndex((w) => !w);
      if (idx >= 0) {
        // 空きスロットがあれば従来通り即座に装備する(交代先を選ぶ必要が無い)。
        ns.weapons = ns.weapons.map((w, i) => (i === idx ? item : w));
        ns.inv = ns.inv.filter((x) => x.id !== item.id);
        ns = pushLog(ns, `${item.name}を構えた。`);
        setG(ns);
        scheduleSaveRun(ns);
        return;
      }
      // 空きが無い場合は、どれと交代するか必ずプレイヤーに選んでもらう(自動で
      // 最も攻撃力の低い武器と入れ替える方式は「勝手に対象が切り替えられて不便」と
      // 不評だったため廃止)。ロックは「捨てる」操作だけをブロックするためのものなので
      // (装備の交換までは妨げない — ステージが進むほど高レア品でも見劣りしていくため)、
      // ロック中の武器も交代先として選べる。
      setG({ ...s0, pendingWeaponSwap: item });
      return;
    } else if (item.kind === "armor") {
      const old = ns.armor[item.slot];
      // 防具もロックは「捨てる」操作のみをブロックし、装備の入れ替えは妨げない(武器と同じ方針)。
      ns.armor = { ...ns.armor, [item.slot]: item };
      ns.inv = ns.inv.filter((x) => x.id !== item.id);
      if (old) ns.inv = [...ns.inv, old];
      const mx = maxHpOf(ns);
      // 防具の HP ボーナス差分を「両方向」に反映する。
      // 上げ幅だけ加算して下げ幅を無視すると、2 つの防具を交互に付け替えて
      // 無限に回復できてしまう(付け替え1往復の収支が 0 になるようにする)。
      const hpDiff = (item.hp || 0) - (old ? (old.hp || 0) : 0);
      ns.player = { ...ns.player, hp: Math.max(1, Math.min(mx, ns.player.hp + hpDiff)) };
      ns = pushLog(ns, `${item.name}を身につけた。`);
    }
    setG(ns);
    scheduleSaveRun(ns);
  }
  // 空きスロットが無い状態で武器を装備しようとした時、g.pendingWeaponSwap に
  // 保留しておいた候補を、プレイヤーが選んだスロットへ確定させる。
  function confirmWeaponSwap(idx) {
    const s0 = gRef.current;
    const item = s0.pendingWeaponSwap;
    if (!item) return;
    // 選んでいる間に他の操作で袋から消えていた場合(多重タップ等)は何もしない。
    if (!s0.inv.some((x) => x.id === item.id)) { setG({ ...s0, pendingWeaponSwap: null }); return; }
    const old = s0.weapons[idx];
    // ロック中の武器も交代先として選べる(ロックは「捨てる」操作だけをブロックする)。
    let ns = {
      ...s0,
      weapons: s0.weapons.map((w, i) => (i === idx ? item : w)),
      inv: s0.inv.filter((x) => x.id !== item.id),
      pendingWeaponSwap: null,
    };
    if (old) ns.inv = [...ns.inv, old];
    ns = pushLog(ns, old ? `${old.name}を仕舞い、${item.name}を構えた。` : `${item.name}を構えた。`);
    setG(ns);
    scheduleSaveRun(ns);
  }
  function cancelWeaponSwap() {
    setG((s) => ({ ...s, pendingWeaponSwap: null }));
  }
  function unequipWeapon(idx) {
    const s0 = gRef.current;
    const w = s0.weapons[idx];
    if (!w) return;
    // 袋が満杯だと何も起きずタップが無反応に見えていたため、袋オーバーレイ内に
    // 直接エラーを表示する(戦闘ログへ積んでも、袋がログを覆い隠すため見えない)。
    if (s0.inv.length >= invCap) { setG({ ...s0, bagActionError: "袋がいっぱいです。何か捨てるか使ってから外してください。" }); return; }
    const ns = { ...s0, weapons: s0.weapons.map((x, i) => (i === idx ? null : x)), inv: [...s0.inv, w], bagActionError: null };
    setG(ns);
    scheduleSaveRun(ns);
  }
  function unequipArmor(slot) {
    const s0 = gRef.current;
    const a = s0.armor[slot];
    if (!a) return;
    if (s0.inv.length >= invCap) { setG({ ...s0, bagActionError: "袋がいっぱいです。何か捨てるか使ってから外してください。" }); return; }
    let ns = { ...s0, armor: { ...s0.armor, [slot]: null }, inv: [...s0.inv, a], bagActionError: null };
    // 装備解除は「新しい防具の付け替え」の片側(旧防具を外すだけ)と同じ収支にする
    // (equipItem のHP差分反映と対称にする。上げ幅だけ加算して下げ幅を無視する経路を
    // 作らないよう、必ず外した防具のHP分だけ減らす)。
    const mx = maxHpOf(ns);
    ns.player = { ...ns.player, hp: Math.max(1, Math.min(mx, ns.player.hp - (a.hp || 0))) };
    setG(ns);
    scheduleSaveRun(ns);
  }
  // 並び替えポップアップ内でのタップ: 1枠目を選び、2枠目で入れ替える(装備・HP・在庫には触れない)。
  function tapReorderSlot(idx) {
    if (reorderSel == null) { setReorderSel(idx); return; }
    if (reorderSel === idx) { setReorderSel(null); return; }
    const s0 = gRef.current;
    const weapons = [...s0.weapons];
    const tmp = weapons[reorderSel]; weapons[reorderSel] = weapons[idx]; weapons[idx] = tmp;
    const ns = { ...s0, weapons };
    setReorderSel(null);
    setG(ns);
    scheduleSaveRun(ns);
  }
  function popDragStart(e, idx) {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    setPopDrag({ idx, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, over: null });
  }
  function popDragMove(e) {
    if (!popDrag) return;
    let over = null;
    for (const k of Object.keys(popSlotRefs.current)) {
      const i = parseInt(k, 10);
      const el = popSlotRefs.current[k];
      if (i === popDrag.idx || !el) continue;
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { over = i; break; }
    }
    setPopDrag({ ...popDrag, dx: e.clientX - popDrag.x0, dy: e.clientY - popDrag.y0, over });
  }
  function popDragEnd(e) {
    if (!popDrag) return;
    const d = popDrag;
    setPopDrag(null);
    const moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 10;
    if (!moved) { tapReorderSlot(d.idx); return; }
    if (d.over == null) return;
    const s0 = gRef.current;
    const weapons = [...s0.weapons];
    const tmp = weapons[d.idx]; weapons[d.idx] = weapons[d.over]; weapons[d.over] = tmp;
    const ns = { ...s0, weapons };
    setReorderSel(null);
    setG(ns);
    scheduleSaveRun(ns);
  }
  function closeBag() {
    setReorderPopup(false);
    setReorderSel(null);
    const s0 = gRef.current;
    let ns = { ...s0, bag: false, bagActionError: null, gearPrep: false };
    if (s0.phase === "battle") ns = ensureWeapon(ns);
    setG(ns);
    if (ns !== s0 && ns.weapons !== s0.weapons) scheduleSaveRun(ns);
  }
  function discardItem(item) {
    // ロック中のアイテムは捨てられない(保護設定は拾った瞬間の自動ロックとして反映済み)
    if (isItemProtected(item)) return;
    const s0 = gRef.current;
    const ns = { ...s0, inv: s0.inv.filter((x) => x.id !== item.id) };
    setG(ns);
    scheduleSaveRun(ns);
  }
  // ドロップ1点を回収する純関数(拾えなければ full: true を添える)
  function takeDropPure(s, item) {
    // 既に回収済み(別の呼び出しで先に拾われた)なら何もしない。多重タップでの二重取得を防ぐ。
    // これが無いと、連打した分だけ同じアイテムが袋・装備へ複製されてしまう。
    if (!s.drops.some((d) => d.id === item.id)) return s;
    item = autoLockItem(item, metaRef.current); // 保護設定に該当すれば拾った瞬間にロックする
    let ns = { ...s, drops: s.drops.filter((d) => d.id !== item.id) };
    if (item.kind === "weapon") {
      const free = ns.weapons.findIndex((w) => !w);
      if (free >= 0) { ns.weapons = [...ns.weapons]; ns.weapons[free] = item; return pushLog(ns, `${item.name}を手にした。`); }
    }
    if (item.kind === "armor" && !ns.armor[item.slot]) {
      ns.armor = { ...ns.armor, [item.slot]: item };
      ns.player = { ...ns.player, hp: Math.min(maxHpOf(ns), ns.player.hp + (item.hp || 0)) };
      return pushLog(ns, `${item.name}を身につけた。`);
    }
    if (ns.inv.length >= invCap) return { ...s, full: true }; // 袋がいっぱい: 拾わない
    ns.inv = [...ns.inv, item];
    return { ...ns, full: false };
  }
  const takeDrop = (item) => {
    const ns = takeDropPure(gRef.current, item);
    setG(ns);
    scheduleSaveRun(ns);
  };
  // ドロップ全回収の純関数
  function takeAllPure(s) {
    let ns = { ...s, full: false };
    // 装備品を先に(空きスロットへ自動装備されるため)
    const ordered = [...ns.drops].sort((a, b) => (a.kind === "item" ? 1 : 0) - (b.kind === "item" ? 1 : 0));
    for (const d of ordered) ns = takeDropPure(ns, d);
    return ns;
  }
  const takeAllDrops = () => {
    const ns = takeAllPure(gRef.current);
    setG(ns);
    scheduleSaveRun(ns);
  };
  // 確認画面用: 全部拾えたらそのまま進む
  const takeAllAndGo = () => {
    const ns = takeAllPure(gRef.current);
    if (ns.drops.length === 0) {
      setG(nextNode({ ...ns, confirm: null })); // nextNode 自体が保存まで行う
      return;
    }
    setG(ns);
    scheduleSaveRun(ns);
  };

  // 先へ進む: 未回収の戦利品 / 未開封のイベントがあれば確認を挟む
  // B-1: nextNode()(→enterNode())は Math.random() での敵生成や saveRun()(I/O)という
  // 副作用を伴うため、setG(updater) の中で呼んではいけない。updater は複数回呼ばれることが
  // あり(同一tick内の連続呼び出し等)、その都度サイコロを振り直しては「画面に出ている敵」と
  // 「保存された敵」がずれる恐れがある。gRef.current から同期的に一度だけ計算する。
  function tryProceed() {
    const s = gRef.current;
    if (s.drops.length > 0) { setG({ ...s, confirm: "drops", full: false }); return; }
    if ((s.phase === "chest" || s.phase === "spring") && !s.eventDone) { setG({ ...s, confirm: "event", full: false }); return; }
    setG(nextNode({ ...s, confirm: null, full: false }));
  }
  const proceedLeaving = () => setG(nextNode({ ...gRef.current, drops: [], confirm: null, full: false }));

  // 装備との比較ヒント
  function hintFor(item, st = g) {
    if (item.kind === "weapon") {
      const eq = st.weapons.filter(Boolean);
      if (eq.length === 0) return { text: "すぐ装備できます", up: true };
      // 武器種ごとに性能設計(短剣は2連撃、大剣は単発高倍率、など)が異なり基礎atkのスケールも
      // バラバラなため、異なる武器種同士でatkを比較しても優劣の目安にならない。
      // 同じ種類の武器とだけ比較する。
      const sameType = eq.filter((w) => w.type === item.type);
      if (sameType.length === 0) return { text: "新しい武器種です", up: true };
      const worst = Math.min(...sameType.map((w) => w.atk));
      const best = Math.max(...sameType.map((w) => w.atk));
      if (item.atk > best) return { text: `↑ 同種で最強(攻 +${item.atk - best})`, up: true };
      if (item.atk > worst) return { text: `↑ 同種の最弱より 攻 +${item.atk - worst}`, up: true };
      return { text: `↓ 同種の方が強い(攻 ${item.atk - worst})`, down: true };
    }
    if (item.kind === "armor") {
      const cur = st.armor[item.slot];
      if (!cur) return { text: "未装備の部位!", up: true };
      const dd = item.def - cur.def, dh = item.hp - cur.hp;
      if (dd > 0 || dh > 0) return { text: `↑ 防 ${dd >= 0 ? "+" : ""}${dd} / HP ${dh >= 0 ? "+" : ""}${dh}`, up: dd + dh > 0 };
      return { text: `↓ 防 ${dd} / HP ${dh}`, down: true };
    }
    return null;
  }

  /* ---------- イベント ---------- */
  function openChest() {
    setG((s) => {
      const item = Math.random() < 0.65 ? makeWeapon(s.floor, { luck: 1.3 }) : makeArmor(s.floor, { luck: 1.3 });
      let ns = { ...s, drops: [item], eventDone: true };
      return pushLog(ns, "苔むした宝箱を開けた。", true);
    });
  }
  function drinkSpring() {
    setG((s) => {
      const mx = maxHpOf(s);
      const heal = Math.round(mx * 0.5);
      let ns = { ...s, eventDone: true };
      ns.player = { ...ns.player, hp: Math.min(mx, ns.player.hp + heal), poison: 0 };
      ns = addFloat(ns, "player", `+${heal}`, "#8fd39a", 22);
      if (Math.random() < 0.35) { ns.drops = [makeConsumable(null, s.floor)]; return pushLog(ns, `泉の底に何かが沈んでいた。HPを${heal}回復した`, true); }
      return pushLog(ns, `泉の水が傷と毒を洗い流した。HPを${heal}回復した`);
    });
  }

  /* ---------- 死と継承 ---------- */
  // 価値の高い順に自動選択(永続アイテム > 高レア装備 > 消耗品)
  function itemScore(it) {
    if (it.locked) return 100000; // ロック済みは継承候補として最優先
    const ri = RARITIES.findIndex((r) => r.id === it.rarity);
    if (it.kind === "item") {
      const c = CONSUMABLES[it.itemId];
      // 雫・心臓は最優先。雫(dew)の実際の kind は "orb"("meta" という kind はコード上存在しない
      // ―― 実装ミスで長らく命中しておらず、雫はスコア14点(ほぼ最下位)扱いだった)。
      if (c.kind === "orb" || c.kind === "metaHp") return 10000;
      return 10 + ri;
    }
    if (it.kind === "weapon") return ri * 100 + it.atk;
    return ri * 100 + it.def * 3 + it.hp;
  }
  function allOwned(s) {
    return [...s.weapons.filter(Boolean), ...Object.values(s.armor).filter(Boolean), ...s.inv];
  }
  // ロック中は継承候補として最優先(itemScore)だが、継承枠を超えた分は他アイテムと同様に対象外。
  // ロックしたものが無条件で必ず継承されると継承枠そのものが意味を持たなくなるため。
  function recommendPick(s, slots) {
    return allOwned(s).map((it) => [it, itemScore(it)])
      .sort((a, b) => b[1] - a[1])
      .slice(0, slots).map(([it]) => it.id);
  }
  function togglePick(item) {
    setG((s) => {
      const pick = s.pick.includes(item.id)
        ? s.pick.filter((x) => x !== item.id)
        : s.pick.length < (s.effSlots ?? meta.slots) ? [...s.pick, item.id] : s.pick;
      return { ...s, pick };
    });
  }
  // 死亡時点で選べる転生先ステージ(既踏破済みの章のみ)。既定は現在のチェックポイント。
  function rebirthStageOptions(m) {
    const max = Math.min(m.checkpoint || 1, 10);
    return Array.from({ length: max }, (_, i) => i); // 0-based: 0=第1章 … max-1=最新到達章
  }
  async function rebirth() {
    bumpSeq(); // 進行中の非同期シーケンスを無効化(S2-2)
    const s = gRef.current;
    const all = [...s.weapons.filter(Boolean), ...Object.values(s.armor).filter(Boolean), ...s.inv];
    const picked = all.filter((x) => s.pick.includes(x.id));
    // 宝樹の雫はアイテムとしてそのまま持ち越さず、選んだ時点で精の結晶へ自動変換する。
    // 生の雫を毎回継承できると、次の生でまた温存して継承…を繰り返せてしまうため。
    const isDew = (x) => x.kind === "item" && x.itemId === "dew";
    const dewCount = picked.filter(isDew).length;
    let inherited = picked.filter((x) => !isDew(x));
    // 剣(武器)は必ず1本引き継ぐ: 選んでいなければ最も強い武器を継承枠とは別に持たせる
    if (!inherited.some((x) => x.kind === "weapon")) {
      const weapons = all.filter((x) => x.kind === "weapon");
      if (weapons.length) inherited = [...inherited, weapons.reduce((a, b) => (b.atk > a.atk ? b : a))];
    }
    const m2 = updateMeta((m) => ({ ...m, inherited, reviveUsedThisRun: false, dewBank: (m.dewBank || 0) + dewCount, everHadWeapon: true }));
    clearRun(); // 死亡セーブを消去して新しい旅を始める
    // 新しい旅へ(選択したステージの頭から。未選択なら現在のチェックポイント=従来通り)
    const eq = starterState(m2);
    const stageOptions = rebirthStageOptions(m2);
    const chosenStage = stageOptions.includes(s.rebirthStage) ? s.rebirthStage : stageOptions[stageOptions.length - 1];
    const startFloor = chosenStage * 10 + 1;
    const base = {
      screen: "run", floor: startFloor, node: 0, nodes: floorNodes(startFloor), phase: "battle",
      player: { hp: 0, poison: 0, atkUp: 0, guard: false },
      ...eq, cds: {}, enemies: [], drops: [],
      logs: [
        { text: "……灯りに導かれ、魂は再び旅の途中へ還る。", strong: true, k: uid() },
        ...(dewCount > 0 ? [{ text: `宝樹の雫 ${dewCount}個が精の結晶に変わった。(${m2.dewBank}個)`, strong: true, k: uid() }] : []),
      ],
      floats: [],
      pending: null, busy: false, bag: false, hitId: null, eventDone: false,
      confirm: null, full: false, lastRareSeen: 0, skillTree: false, reviveUsed: false, stageIntro: stageOf(startFloor),
    };
    base.player.hp = maxHpOf(base, m2);
    const first = enterNode(base);
    saveRun(first.floor, first.node, first.player, first.weapons, first.armor, first.inv, first.cds, first.lastRareSeen, first.orbBagBonus, first.enemies);
    setG(first);
    // 継承品はこの旅へ渡した時点で meta 上は消費済みにする。残しておくと、中断して
    // タイトルへ戻り再度始めるたびに同じ継承品が何度でも手に入ってしまう(無限増殖)。
    // metaRef.current を土台にする(直前の enterNode が seen を更新している可能性があるため)。
    updateMeta({ inherited: [] });
  }

  /* ---------- 宝樹の祠(デイリーイベント) ---------- */
  // 祠を開いている間、観測した最大時刻を前進させておく(時刻の巻き戻し検知の基準)。
  useEffect(() => {
    if (g.screen !== "event") return;
    const m = metaRef.current; if (!m) return;
    const m2 = touchEventSeen(m);
    if (m2.eventSeenMax !== m.eventSeenMax) updateMeta(m2);
  }, [g.screen]);

  // 「挑戦する」— 遭遇フェーズへ移行するだけ。日付確定は捕獲完了時(reportApproach)に行う。
  function eventStart() {
    if (!eventStatus(metaRef.current).available) return;
    setG((s) => ({ ...s, event: { phase: "encounter", turn: 1, converted: [] } }));
  }

  // 金枝の古精に近づく。EVENT_TURNS 回で必ず捕獲(v1は取り逃がしなし。将来ここに判定を足せる)。
  function eventApproach() {
    const s = gRef.current;
    const turn = (s.event?.turn || 1) + 1;
    if (turn > EVENT_TURNS) {
      // 捕獲完了 — ここで初めて当日分を確定し、報酬状態を保存する
      updateMeta((m) => ({ ...commitEventDay(m), eventReward: { converted: [], reward2x: false } }));
      try { window.webkit?.messageHandlers?.progress?.postMessage({ event: "event_challenge", reward2x: false }); } catch (_) {}
      setG((prev) => ({ ...prev, event: { ...prev.event, phase: "reward" } }));
    } else {
      setG((prev) => ({ ...prev, event: { ...prev.event, turn } }));
    }
  }

  // 宝樹の雫を1つ変換する(継承枠 or 精の結晶)。run 用の saveRun は呼ばない。
  // 前提判定・状態組み立てはすべて gRef.current から同期的に行う(resolveOrbChoice と同じ理由:
  // setG(updater) の updater 内で確定させた値を直後の副作用側で読もうとすると、React 18 では
  // updater が後回しになることがあり、副作用〈=報酬付与〉ごとスキップされてしまう)。
  function eventConvert(kind) {
    const s0 = gRef.current;
    const ev = s0.event || {};
    const total = 1 + (ev.reward2x ? 1 : 0);
    if ((ev.converted || []).length >= total) return; // 連打ガード: これ以上は変換できない
    const newConverted = [...(ev.converted || []), kind];
    const ns = { ...s0, event: { ...ev, converted: newConverted } };
    setG(ns);
    // AD-04: resolveOrbChoice と同じ理由で、同一ティック内でもう一方のボタンが押されても
    // 直前の choice を確実に見えるようにする(次のレンダーを待つと gRef.current が古いままで、
    // 「継承枠+1」「精の結晶+1」を連打すると両方通ってしまう実例を確認した)。
    gRef.current = ns;

    // 全報酬受け取り済みなら eventReward をクリア、途中ならカレント状態を保存
    updateMeta((m) => {
      const m2 = kind === "slot"
        ? { ...m, slots: (m.slots || 0) + 1 }
        : { ...m, dewBank: (m.dewBank || 0) + 1 };
      return newConverted.length >= total
        ? { ...m2, eventReward: null }
        : { ...m2, eventReward: { ...(m.eventReward || {}), converted: newConverted } };
    });
  }

  // 通常ドロップの宝樹の雫を1つ変換する(継承枠 or 精の結晶)。
  // 前提判定・状態組み立てはすべて gRef.current から同期的に行う(useItem と同じ理由:
  // setG(updater) の updater は React 18 で後回しになりうるため、updater の中で確定させた値を
  // 直後の副作用(setMeta 等)側で読もうとすると、その副作用ごと丸々スキップされてしまう
  // ―― 実際に「雫を使っても継承枠も結晶も増えない」という形でこのプロジェクトで発生した実例)。
  // 「継承枠にする」/「結晶にする」の二択ボタンをほぼ同時にタップされても片方だけが適用
  // されるよう、setG の直後に gRef.current もその場で最新化する(次のレンダーを待たない)。
  // 以前はこれをしていなかったため、2つのボタンをほぼ同時に押すと両方とも
  // gRef.current.orbChoice=true をまだ見てしまい、後勝ちの setMeta で片方の報酬
  // (枠+1 or 結晶+1)が黙って消えることがあった。
  function resolveOrbChoice(kind) {
    const st0 = gRef.current;
    if (!st0.orbChoice) return; // 既に他方のボタン(または多重タップ)で処理済み
    // ここで初めて雫を袋から消費する(useItem では選択が確定するまで消さずに残しておいた)。
    const dewIdx = st0.inv.findIndex((x) => x.kind === "item" && x.itemId === "dew");
    const inv = dewIdx >= 0 ? st0.inv.filter((_, i) => i !== dewIdx) : st0.inv;
    const text = kind === "slot" ? "宝樹の雫が輝く……継承枠が永続+1された。" : "宝樹の雫が砕け、精の結晶に変わった。";
    // B-3: ログの形は { text, strong, k } に統一する(pushLog と同じ形)。{ id, text, hi } という
    // 別形式だと、描画側が見ている key={l.k} / l.strong が undefined になり、React の
    // 重複キー警告や描画崩れの原因になる。
    const committed = pushLog({ ...st0, inv, orbChoice: false }, text, true);
    setG(committed);
    gRef.current = committed; // 同一ティック内で他方のボタンが押されても orbChoice=false を見るようにする

    updateMeta((m) => kind === "slot"
      ? { ...m, slots: (m.slots || 0) + 1 }
      : { ...m, dewBank: (m.dewBank || 0) + 1 });
    // 雫消費後の状態を保存(タスキル後に雫が復活して二重適用されるのを防ぐ)。
    flushSaveRun(committed);
  }

  /* ============================================================
     描画
  ============================================================ */
  if (!meta) {
    return (
      <div className="kw-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{CSS}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 10, letterSpacing: ".55em", color: "rgba(157,180,166,.45)", marginBottom: 14 }}>
            now loading
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="kw-loading-dot"
                style={{ animation: `kw-dot-fade 1.4s ${i * 0.22}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- タイトル ---------- */
  if (g.screen === "title") {
    return (
      <div className="kw-root">
        <style>{CSS}</style>
        <StageBackdrop floor={1} />
        <div className="kw-vignette" />
        <button className="kw-btn ghost" style={{ position: "fixed", top: "calc(14px + env(safe-area-inset-top))", right: 16, zIndex: 10, padding: "6px 10px" }}
          onClick={() => setG((s) => ({ ...s, settingsOpen: true }))}>
          <Settings size={16} />
        </button>
        <div className="kw-title">
          <div className="kw-tsub">装備を集めて、さらなる奥地へ。</div>
          <h2>ダンジョンローグ</h2>
          <div className="kw-tmeta">
            死は終わりではない。魂に刻んだ武具だけが、次の旅へ受け継がれる。<br />
            森、湿原、遺跡、花の谷、水晶洞、焔、氷、雷、星──そして常夜の根。<br />
            百層の底に、何が眠っているのだろうか。
          </div>
          {!meta.everHadWeapon && (
            <div style={{ width: "100%", maxWidth: 480, marginTop: 6 }}>
              <div style={{ fontSize: 11, color: "var(--mist)", letterSpacing: ".3em", marginBottom: 8, textAlign: "center" }}>はじめの武器を選ぶ</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {["dagger", "axe", "bow", "staff"].map((type) => {
                  const t = WEAPON_TYPES[type];
                  const sel = startWeapon === type;
                  return (
                    <button key={type}
                      className={`kw-panel kw-wcard ${sel ? "selected" : ""}`}
                      style={{ width: 110, padding: "8px 10px", flex: "0 0 auto" }}
                      onClick={() => setStartWeapon(type)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <AssetIcon assetId={t.asset} size={16} color={sel ? "var(--hotaru)" : "var(--mist)"} />
                        <span className="kw-typechip" style={{ color: sel ? "var(--hotaru)" : undefined }}>{t.dmgType}</span>
                      </div>
                      <div className="kw-wname" style={{ fontSize: 12 }}>{t.label}</div>
                      <div style={{ fontSize: 9.5, color: "var(--mist)", lineHeight: 1.5, marginTop: 2 }}>{t.tags[0]}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {savedRun && (
            // 中断中の冒険がある間は、それを無言で捨てる経路(「続ける」で新しく始める/「放棄」)を
            // 一切出さない。必ず「再開」または「転生を選ぶ」だけを通す。
            <div style={{ display: "flex", gap: 8, marginTop: 6, justifyContent: "center" }}>
              {savedRun.phase === "dead" ? (
                <button className="kw-btn" style={{ padding: "13px 32px", fontSize: 14, borderColor: "var(--danger)", color: "var(--danger)" }}
                  onClick={() => resumeRun(savedRun)}>
                  転生を選ぶ（旅人は倒れた）
                </button>
              ) : (
                <button className="kw-btn" style={{ padding: "13px 32px", fontSize: 14, borderColor: "var(--hotaru)", color: "var(--hotaru)" }}
                  onClick={() => resumeRun(savedRun)}>
                  再開（{floorLabel(savedRun.floor)}層）
                </button>
              )}
            </div>
          )}
          {/* 「続ける/森へ入る」は中断中の冒険を無言で上書きしてしまうため、savedRun が無い
              (=失うものが無い)ときだけ出す。「章を選ぶ」は生存中なら所持品を保ったままの
              安全なワープなので、savedRun の有無にかかわらず常に出してよい。 */}
          {!savedRun && (
            <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center" }}>
              <button className="kw-btn primary" style={{ padding: "13px 32px", fontSize: 14 }}
                onClick={() => startRun()}>
                {meta.checkpoint > 1 ? `第${Math.min(meta.checkpoint, 10)}章から続ける` : "森 へ 入 る"}
              </button>
              {meta.checkpoint > 1 && (
                <button className="kw-btn ghost" style={{ padding: "13px 18px", fontSize: 13 }}
                  onClick={() => setG((s) => ({ ...s, chapterSelect: true }))}>章を選ぶ</button>
              )}
            </div>
          )}
          {savedRun && meta.checkpoint > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center" }}>
              <button className="kw-btn ghost" style={{ padding: "13px 18px", fontSize: 13 }}
                onClick={() => setG((s) => ({ ...s, chapterSelect: true }))}>章を選ぶ</button>
            </div>
          )}
          {eventStatus(meta).withinPeriod && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
              <button className="kw-btn ghost" style={{ padding: "10px 28px", position: "relative",
                borderColor: "rgba(232,180,74,.5)", color: "var(--hotaru)",
                textAlign: "center", lineHeight: 1.5 }}
                onClick={() => { setShowEventBanner(false); setG({ screen: "event", event: { phase: "intro" } }); }}>
                <div style={{ fontSize: 10, opacity: 0.75, letterSpacing: ".1em" }}>🎉 期間限定イベント</div>
                <div style={{ fontSize: 14, letterSpacing: ".2em" }}>宝 樹 の 祠</div>
                {eventStatus(meta).available && (
                  <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%",
                    background: "var(--hotaru)", boxShadow: "0 0 6px var(--hotaru)" }} />
                )}
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 4, flexWrap: "wrap" }}>
            <button className="kw-btn ghost" style={{ padding: "8px 16px", fontSize: 12 }}
              onClick={() => setG((s) => ({ ...s, howToPlay: true }))}>遊び方</button>
            <button className="kw-btn ghost" style={{ padding: "8px 16px", fontSize: 12 }}
              onClick={() => setG((s) => ({ ...s, skillTree: true }))}>
              スキルツリー{(meta.dewBank || 0) > 0 ? ` ✦${meta.dewBank}` : ""}
            </button>
            <button className="kw-btn ghost" style={{ padding: "8px 16px", fontSize: 12 }}
              onClick={() => setG((s) => ({ ...s, bestiary: true }))}>図鑑</button>
          </div>
          <div className="kw-tmeta" style={{ marginTop: 10, fontSize: 11.5 }}>
            転生 {meta.deaths} 回 ／ 最深 {floorLabel(meta.bestFloor)} ／ 継承枠 {meta.slots}
            {meta.inherited?.length > 0 && <> ／ 継承品 {meta.inherited.length} 点</>}
            {meta.clears > 0 && <> ／ 百層踏破 {meta.clears} 回</>}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
            <button className="kw-btn ghost" style={{ fontSize: 11, padding: "6px 16px", opacity: .65 }}
              onClick={writeReview}>
              ★ レビューする
            </button>
            <button className="kw-btn ghost" style={{ fontSize: 11, padding: "6px 16px", opacity: .65 }}
              onClick={() => openURL(DEVELOPER_URL)}>
              他のアプリも見る
            </button>
          </div>
        </div>
        {/* 章選択 — 背景が透けて見えるよう半透明 */}
        {g.chapterSelect && (
          <div className="kw-overlay" style={{ background: "rgba(6,10,8,.65)", backdropFilter: "none" }}
            onClick={() => setG((s) => ({ ...s, chapterSelect: false }))}>
            <div className="kw-panel kw-sheet" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ letterSpacing: ".2em" }}>章 を 選 ぶ</h2>
              <div className="kw-sub">
                ボスを倒した章の頭から再挑戦できます。継承品はそのまま持ち込まれます。
                {savedRun && savedRun.phase !== "dead" && <>
                  中断中の冒険がある場合は、所持品とHPを保ったまま章の頭へ移動します。<br />
                  <span style={{ fontSize: 10.5 }}>移動すると「今の1回の冒険」の現在地が変わります。その後「中断してタイトルへ」で戻ると、次の「再開」は移動先の章から始まります(踏破記録・継承枠などの記録自体は減りません)。</span>
                </>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 12 }}>
                {STAGES.map((st, i) => {
                  const ch = i + 1;
                  if (ch > meta.checkpoint) return null;
                  const cleared = ch < meta.checkpoint;
                  const current = ch === meta.checkpoint;
                  // 「今まさにいる章」(生存中の中断データがある場合のみ意味を持つ)。
                  // ここへワープしても何も変わらない(足止めなしの敵リロールだけになる)ため選べなくする。
                  const isHereNow = savedRun && savedRun.phase !== "dead" && stageOf(savedRun.floor) === i;
                  return (
                    <button key={i} disabled={isHereNow}
                      style={{
                        position: "relative", overflow: "hidden", height: 90,
                        borderRadius: 8, border: current ? "1.5px solid var(--hotaru)" : "1px solid rgba(157,180,166,.18)",
                        textAlign: "left", cursor: isHereNow ? "default" : "pointer", padding: 0,
                        opacity: isHereNow ? 0.6 : 1,
                      }}
                      onClick={() => {
                        if (isHereNow) return;
                        if (savedRun && savedRun.phase !== "dead") {
                          // 冒険中(生存中)のワープ: 何も失われないので確認なしで移動する
                          warpToChapter(i, savedRun);
                        } else if (savedRun) {
                          // 死亡データが残っている場合は「転生を選ぶ」へ誘導する(そちら自体に
                          // 章選択が付いているため、ここで別途新しい生を開始する必要はない。
                          // 中断データを無言で破棄する経路は作らない)。
                          setG((s) => ({ ...s, chapterSelect: false }));
                          resumeRun(savedRun);
                        } else {
                          setG((s) => ({ ...s, chapterSelect: false })); startFromChapter(i);
                        }
                      }}>
                      {/* ステージ背景プレビュー */}
                      <StageBackdrop floor={i * 10 + 1} preview={true} />
                      {/* テキスト */}
                      <div style={{ position: "absolute", inset: 0, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                        <div style={{ fontSize: 9, color: "var(--mist)", letterSpacing: ".25em", marginBottom: 2 }}>第{ch}章</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--paper)", lineHeight: 1.3 }}>{st.name}</div>
                        <div style={{ fontSize: 9.5, marginTop: 3, color: isHereNow ? "var(--mist)" : cleared ? "#8fd39a" : "var(--hotaru)" }}>
                          {isHereNow ? "◆ 今いる章" : cleared ? "✓ クリア済み" : "▶ 現在の到達地点"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="kw-divider" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <button className="kw-btn ghost" style={{ fontSize: 11, color: "var(--mist)", padding: "6px 12px" }}
                  onClick={() => setG((s) => ({ ...s, chapterSelect: false, confirmReset: true }))}>
                  やり直す
                </button>
                <button className="kw-btn ghost" style={{ padding: "6px 16px", fontSize: 12 }} onClick={() => setG((s) => ({ ...s, chapterSelect: false }))}>閉じる</button>
              </div>
            </div>
          </div>
        )}
        {g.confirmReset && (
          <div className="kw-overlay top" onClick={() => setG((s) => ({ ...s, confirmReset: false }))}>
            <div className="kw-panel kw-sheet" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ color: "var(--danger)" }}>やり直し確認</h2>
              <div className="kw-sub">
                継承品と到達章をリセットして、第1章から再スタートします。<br />
                転生回数・継承枠・踏破記録は引き継がれます。<br />
                この操作は元に戻せません。
              </div>
              <div className="kw-actions">
                <button className="kw-btn ghost" style={{ marginRight: "auto" }}
                  onClick={() => setG((s) => ({ ...s, confirmReset: false }))}>← キャンセル</button>
                <button className="kw-btn" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                  onClick={() => {
                    updateMeta((m) => ({ ...m, checkpoint: 1, inherited: [] }));
                    // S-4: 中断中のランが残っていると、checkpoint=1 にリセットしたのに
                    // タイトルの「再開」が深い章のままのデータを指し続けてしまう。
                    clearRun(); setSavedRun(null);
                    setG({ screen: "title" });
                  }}>やり直す</button>
              </div>
            </div>
          </div>
        )}
        {g.howToPlay && (() => {
          const GUIDE_TABS = [
            { id: "battle", label: "① 戦闘" },
            { id: "weapon", label: "② 武器" },
            { id: "gear", label: "③ 装備" },
            { id: "item", label: "④ アイテム" },
            { id: "death", label: "⑤ 死と継承" },
          ];
          const heading = (text) => (
            <div style={{ fontSize: 11, color: "var(--hotaru)", letterSpacing: ".2em", margin: "4px 0 8px" }}>── {text} ──</div>
          );
          const ITEM_KIND_LABEL = { heal: "回復", cure: "解毒", buff: "バフ", bomb: "攻撃", orb: "特殊", metaHp: "特殊" };
          return (
          <div className="kw-overlay" onClick={() => setG((s) => ({ ...s, howToPlay: false }))}>
            {/* スキルツリーと同様、タブを切り替えても枠の大きさが変わらないよう高さを固定する。 */}
            <div className="kw-panel kw-sheet" style={{ maxWidth: 580, height: "82vh", textAlign: "left", display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: "16px 20px 10px", flexShrink: 0, borderBottom: "1px solid rgba(157,180,166,.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ letterSpacing: ".2em" }}>遊び方</h2>
                <button className="kw-btn ghost" style={{ padding: "6px 12px" }}
                  onClick={() => setG((s) => ({ ...s, howToPlay: false }))}><X size={14} /></button>
              </div>
              <div style={{ overflowY: "auto", flex: 1, padding: "14px 20px 4px" }}>

                {guideTab === "battle" && (
                  <>
                    {heading("戦闘の進め方")}
                    <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "var(--paper)" }}>
                      下の<b style={{ color: "var(--hotaru)" }}>武器カード</b>をタップすると攻撃します。単体攻撃の武器は続けて狙う敵をタップ、全体攻撃の武器(本・楽器)はタップした瞬間に発動します。敵は複数体いる時があり、タップで狙いを選べます。<br /><br />
                      自分が1回行動すると、必ず敵にも1手番が返ってきます。<b style={{ color: "var(--hotaru)" }}>防御</b>ボタンで構えると、次に受けるダメージが半分になります。HPが減ってきたら防御か回復アイテムで立て直しましょう。<br /><br />
                      ダメージ欄に「<b style={{ color: "var(--hotaru)" }}>弱点</b>」と出たら<b style={{ color: "var(--paper)" }}>1.6倍</b>、「<b style={{ color: "var(--paper-dim)" }}>耐性</b>」と出たら<b style={{ color: "var(--paper)" }}>0.5倍</b>のダメージになっています。一度見た弱点・耐性は図鑑に記録され、次に同じ敵と会った時の目印になります。<br /><br />
                      <b style={{ color: "var(--hotaru)" }}>再使用までのターン数(CT)</b>: 武器を使うと、その武器の再使用までのターン数がわかっている場合はロックされます。表示されているCTの数だけ、自分のターンが来るたびに1ずつ減っていき、0になると再び使えます。CT表示が無い武器(短剣・弓)は毎ターン使えます。
                    </div>
                  </>
                )}

                {guideTab === "weapon" && (
                  <>
                    {heading("武器の効果(属性と特徴)")}
                    <div style={{ fontSize: 12.5, lineHeight: 1.8, color: "var(--mist)", marginBottom: 10 }}>
                      武器には <b style={{ color: "var(--paper)" }}>斬・打・突・魔・音</b> の5属性があり、敵ごとに効きやすい/効きにくい属性が決まっています。手こずったら別属性の武器を試しましょう。ダメージ倍率は基礎攻撃力に対する倍率です。
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {GUIDE_WEAPON_ORDER.map((type) => {
                        const t = WEAPON_TYPES[type];
                        return (
                          <div key={type} style={{ display: "flex", gap: 10, padding: "8px 10px", background: "rgba(0,0,0,.2)", borderRadius: 8 }}>
                            <AssetIcon assetId={t.asset} size={18} color="var(--hotaru)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 12, color: "var(--paper)", fontFamily: "var(--font-display)", fontWeight: 700 }}>{t.label}</span>
                                <span className="kw-typechip">{t.dmgType}</span>
                              </div>
                              <div style={{ fontSize: 11, color: "var(--mist)", marginTop: 3, lineHeight: 1.7 }}>{GUIDE_WEAPON_MECHANICS[type]}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {guideTab === "gear" && (
                  <>
                    {heading("装備を整えるタイミング")}
                    <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "var(--paper)" }}>
                      <b style={{ color: "var(--hotaru)" }}>装備の変更(武器・防具の付け替え)は戦闘中はできません。</b>新しい章に入ると「戦闘準備」の画面が自動で開くので、そこで武具を整えてから最初の戦闘に臨みましょう。<br /><br />
                      それ以外の場面では、サブバーの<b style={{ color: "var(--paper)" }}>「袋」</b>ボタンから武具の付け替え・回復アイテムの使用・不要品を「捨てる」で手放す、が行なえます。手放されたくない装備は鍵アイコンで<b style={{ color: "var(--paper)" }}>ロック</b>しておくと誤って「捨てる」ことがなくなります(ロック中でも新しい武具への交換は可能です。ロックが防ぐのは「捨てる」操作だけです)。<br /><br />
                      武器スロットが空きなく新しい武器を装備しようとすると、どの武器と交代するかを選ぶ画面が出ます。装備中の武器欄の「並び替え」ボタンからは、ドラッグで武器の並び順(左右)だけを入れ替えられます。
                    </div>
                  </>
                )}

                {guideTab === "item" && (
                  <>
                    {heading("アイテムの分類")}
                    <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "var(--paper)", marginBottom: 10 }}>
                      戦闘に勝つ・宝箱を開ける・泉に立ち寄る、といった行動で武器・防具・消耗品のいずれかが手に入ります。消耗品は主に5種類です。
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {Object.entries(CONSUMABLES).map(([id, c]) => (
                        <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "rgba(0,0,0,.2)", borderRadius: 8 }}>
                          <AssetIcon assetId={c.asset} size={18} color="var(--hotaru)" />
                          <div style={{ minWidth: 66, fontSize: 11, color: "var(--paper)" }}>{c.label}</div>
                          <span className="kw-typechip">{ITEM_KIND_LABEL[c.kind] || c.kind}</span>
                          <div style={{ fontSize: 11, color: "var(--mist)", flex: 1 }}>{c.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "var(--paper)", marginTop: 14 }}>
                      武器・防具には<b style={{ color: "var(--hotaru)" }}>レア度</b>があります({RARITIES.map((r) => r.label).join("・")}の{RARITIES.length}段階)。レア度が高いほど性能が良く、より奥の階層で見つかりやすくなります。
                    </div>
                  </>
                )}

                {guideTab === "death" && (
                  <>
                    {heading("死と継承")}
                    <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "var(--paper)" }}>
                      倒れても、そこで選んだ装備は次の旅へ持ち越せます(継承)。ロック中のアイテムは継承候補として優先的に選ばれます。<br /><br />
                      章のボスを倒しておくと、以後は死んでもその章の頭から再開できるようになります。行き詰まったら深追いせず引き返すのも手です。
                    </div>
                  </>
                )}

              </div>
              {/* 画面下部の固定タブバー(横スクロールで選べる)。 */}
              <div style={{ flexShrink: 0, borderTop: "1px solid rgba(157,180,166,.12)", padding: "10px 12px",
                overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", width: "max-content" }}>
                  {GUIDE_TABS.map((tb) => (
                    <button key={tb.id} className={`kw-btn ${guideTab === tb.id ? "primary" : "ghost"}`}
                      style={{ padding: "6px 12px", fontSize: 11, flexShrink: 0 }}
                      onClick={() => setGuideTab(tb.id)}>
                      {tb.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* ── フッター(スキルツリーと同じ、画面下部の閉じるボタン) ── */}
              <div style={{ flexShrink: 0, padding: "8px 18px 12px", display: "flex", justifyContent: "center", borderTop: "1px solid rgba(157,180,166,.08)" }}>
                <button className="kw-btn ghost" style={{ padding: "9px 48px" }}
                  onClick={() => setG((s) => ({ ...s, howToPlay: false }))}>閉じる</button>
              </div>
            </div>
          </div>
          );
        })()}
        {g.settingsOpen && (
          <SettingsOverlay
            onClose={() => setG((s) => ({ ...s, settingsOpen: false }))}
            bgmVolume={bgmVolume} seVolume={seVolume}
            changeBgmVolume={changeBgmVolume} changeSeVolume={changeSeVolume}
            sleepDisabled={sleepDisabled} toggleSleep={toggleSleep}
            openURL={openURL}
            manageConsent={manageConsent} consentApplicable={consentApplicable}
            meta={meta} toggleMetaFlag={toggleMetaFlag}
            cssClass=""
          />
        )}
        {g.skillTree && (
          <SkillTreeOverlay meta={meta} onClose={() => setG((s) => ({ ...s, skillTree: false }))} onBuy={buySkill} onDismissRefund={dismissRefundNotice} />
        )}
        {g.bestiary && (
          <BestiaryOverlay meta={meta} onClose={() => setG((s) => ({ ...s, bestiary: false }))} />
        )}
        {showEventBanner && meta && eventStatus(meta).available && (
          <div className="kw-overlay top" onClick={() => setShowEventBanner(false)}>
            <div className="kw-panel kw-sheet" style={{ maxWidth: 320, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 28 }}>🎉</div>
              <h3 style={{ color: "var(--hotaru)", letterSpacing: ".2em", margin: "8px 0 4px", fontSize: 17 }}>宝 樹 の 祠</h3>
              <div style={{ fontSize: 11, color: "var(--mist)", letterSpacing: ".1em", marginBottom: 14 }}>期間限定イベント開催中</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "var(--paper)", marginBottom: 16 }}>
                {EVENT_START.replaceAll("-", ".")}〜{EVENT_END.replaceAll("-", ".")}<br />
                毎日1回、金枝の古精に会いに行こう。<br />
                報酬は継承枠か精の結晶に変えられるよ。
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button className="kw-btn ghost" style={{ padding: "9px 18px", fontSize: 13,
                  borderColor: "rgba(232,180,74,.5)", color: "var(--hotaru)" }}
                  onClick={() => { setShowEventBanner(false); setG({ screen: "event", event: { phase: "intro" } }); }}>
                  祠 へ 行 く
                </button>
                <button className="kw-btn ghost" style={{ padding: "9px 18px", fontSize: 13 }}
                  onClick={() => setShowEventBanner(false)}>
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
        {showCompensation && meta && !meta.compensationDewClaimed && (
          <div className="kw-overlay top">
            <div className="kw-panel kw-sheet" style={{ maxWidth: 340, textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>
                <Sparkles size={28} color="var(--hotaru)" strokeWidth={1.5} />
              </div>
              <h3 style={{ color: "var(--hotaru)", letterSpacing: ".2em", margin: "8px 0 4px", fontSize: 16 }}>お詫びと感謝の印</h3>
              <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "var(--paper)", margin: "10px 0 18px" }}>
                以前のバージョンで、宝樹の雫を使っても継承枠・精の結晶が増えない不具合がありました。<br />
                お詫びとして、<b style={{ color: "var(--hotaru)" }}>精の結晶を{COMPENSATION_DEW_AMOUNT}個</b>を配布いたします。不具合が生じてしまい申し訳ございません。
              </div>
              <button className="kw-btn primary" style={{ padding: "10px 28px", fontSize: 13 }}
                onClick={claimCompensationDew}>
                受け取る
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- 宝樹の祠(デイリーイベント / 本編とは別枠) ---------- */
  if (g.screen === "event") {
    const est = eventStatus(meta);
    // × で閉じた後に再入した場合、meta.eventReward から報酬フェーズを復元する
    const ev = (() => {
      const raw = g.event || { phase: "intro" };
      if (meta?.eventReward && est.claimedToday && raw.phase === "intro") {
        return { phase: "reward", ...meta.eventReward };
      }
      return raw;
    })();
    const rewardTotal = 1 + (ev.reward2x ? 1 : 0);
    const remaining = rewardTotal - (ev.converted || []).length;
    const adPending = g.rewardAdPending === "eventDew";
    const canAd = !ev.adClaimed && rewardAdUsesLeft(meta) > 0;
    const turn = ev.turn || 1;
    return (
      <div className="kw-root">
        <style>{CSS}</style>
        <StageBackdrop floor={91} />
        <div className="kw-vignette" />
        <button className="kw-btn ghost" style={{ position: "fixed", top: "calc(14px + env(safe-area-inset-top))", right: 16, zIndex: 10, padding: "6px 10px" }}
          onClick={() => setG({ screen: "title" })}>
          <X size={16} />
        </button>
        <div className="kw-title">
          <div className="kw-tsub">カテゴリ別ランキング 70 位突破記念</div>
          <h2 style={{ fontSize: 26 }}>宝 樹 の 祠</h2>
          <div style={{ fontSize: 10.5, letterSpacing: ".2em", color: "var(--paper-dim)", marginTop: -2 }}>
            {EVENT_START.replaceAll("-", ".")} 〜 {EVENT_END.replaceAll("-", ".")} 期間限定
          </div>

          {ev.phase === "intro" && (
            <div className="kw-panel" style={{ maxWidth: 420, padding: 20, marginTop: 12, textAlign: "center" }}>
              <div style={{ margin: "6px auto 14px", width: 76, height: 76, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(232,180,74,.28), transparent 70%)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AssetIcon assetId="goldSprite" size={40} color="var(--hotaru)" />
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "var(--mist)" }}>
                記念の祠には、期間中の日ごとに一度だけ金枝の古精が姿を見せる。<br />
                捕まえれば宝樹の雫を授かり、精の結晶か継承枠に変えられる。
              </div>
              {est.clockBack ? (
                <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--danger)", lineHeight: 1.8 }}>
                  端末の時刻が実際より前に設定されています。<br />正しい時刻に戻すと挑戦できます。
                </div>
              ) : est.afterPeriod ? (
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--hotaru)" }}>記念イベントは終了しました。ご参加ありがとう。</div>
              ) : est.beforePeriod ? (
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--hotaru)" }}>{EVENT_START.replaceAll("-", ".")} から開催します。</div>
              ) : est.available ? (
                <>
                  <div style={{ marginTop: 16, fontSize: 10.5, color: "var(--paper-dim)" }}>挑戦すると本日分を消費します</div>
                  <button className="kw-btn primary" style={{ marginTop: 8, padding: "12px 32px", fontSize: 13 }}
                    onClick={eventStart}>挑 戦 す る</button>
                </>
              ) : (
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--hotaru)" }}>本日は挑戦済み。また明日、姿を見せるだろう。</div>
              )}
            </div>
          )}

          {ev.phase === "encounter" && (
            <div className="kw-panel" style={{ maxWidth: 420, padding: "16px 20px", marginTop: 10 }}>
              {/* 古精 */}
              <div style={{ textAlign: "center" }}>
                <div style={{ margin: "4px auto 6px", width: 88, height: 88, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(232,180,74,.3), transparent 72%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "kw-dot-fade 2s ease-in-out infinite" }}>
                  <AssetIcon assetId="goldSprite" size={48} color="var(--hotaru)" />
                </div>
                <div style={{ fontSize: 11.5, color: "var(--hotaru)", letterSpacing: ".1em", marginBottom: 8 }}>金枝の古精</div>
                {/* 気配バー — ターンが進むほど消えていく */}
                <div style={{ display: "flex", gap: 4, justifyContent: "center", maxWidth: 140, margin: "0 auto" }}>
                  {[1, 2, 3].map((i) => {
                    const lit = i <= Math.max(0, EVENT_TURNS - turn + 1);
                    return (
                      <div key={i} style={{ flex: 1, height: 8, borderRadius: 4,
                        background: lit ? "rgba(232,180,74,.75)" : "rgba(255,255,255,.1)",
                        transition: "background .4s ease",
                        boxShadow: lit ? "0 0 6px rgba(232,180,74,.4)" : "none" }} />
                    );
                  })}
                </div>
                <div style={{ fontSize: 9, color: "var(--mist)", letterSpacing: ".1em", marginTop: 4 }}>気 配</div>
              </div>

              {/* ターン進行テキスト */}
              <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.9, color: "var(--mist)", minHeight: 46, textAlign: "center" }}>
                {turn === 1 && "古精は枝から枝へ、金色の尾を引いて渡っていく。"}
                {turn === 2 && "そっと手を伸ばす。光の粒が指先をかすめた。"}
                {turn >= 3 && "いま――。こぼれる光ごと、両手で包み込む。"}
              </div>
              <div style={{ textAlign: "center" }}>
                <button className="kw-btn primary" style={{ marginTop: 10, padding: "12px 32px", fontSize: 13 }}
                  onClick={eventApproach}>
                  {turn >= EVENT_TURNS ? "捕 ま え る" : "近 づ く"}
                </button>
              </div>
            </div>
          )}

          {ev.phase === "reward" && (
            <div className="kw-panel" style={{ maxWidth: 420, padding: 20, marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 6 }}>
                <AssetIcon assetId="dew" size={22} color="var(--hotaru)" />
                <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--hotaru)" }}>
                  宝樹の雫 ×{rewardTotal}
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: 11, color: "var(--mist)", marginBottom: 12 }}>
                古精を捕まえた。{remaining > 0 ? "使いみちを選んでください" : "また明日、祠へ。"}
              </div>

              {remaining > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="kw-btn ghost" style={{ textAlign: "left", padding: "12px 14px" }}
                    onClick={() => eventConvert("slot")}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--paper)" }}>継承枠 +1</div>
                    <div style={{ fontSize: 10, color: "var(--mist)", marginTop: 3 }}>転生時に引き継げるアイテム数が増える。現在 {meta.slots || 0} 枠。</div>
                  </button>
                  <button className="kw-btn ghost" style={{ textAlign: "left", padding: "12px 14px" }}
                    onClick={() => eventConvert("crystal")}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--paper)" }}>精の結晶 +1</div>
                    <div style={{ fontSize: 10, color: "var(--mist)", marginTop: 3 }}>スキルツリーの習得に使える結晶に変換する。現在 {meta.dewBank || 0} 個。</div>
                  </button>
                  {remaining > 1 && (
                    <div style={{ textAlign: "center", fontSize: 10.5, color: "var(--paper-dim)" }}>あと {remaining} つ選べます</div>
                  )}
                </div>
              ) : (
                <button className="kw-btn primary" style={{ width: "100%", padding: "12px", fontSize: 13 }}
                  onClick={() => setG({ screen: "title" })}>祠 を 出 る</button>
              )}

              {canAd && (
                <button className="kw-btn ghost" style={{ width: "100%", marginTop: 10, padding: "10px", fontSize: 11.5,
                  color: "var(--hotaru)", borderColor: "rgba(232,180,74,.35)", opacity: adPending ? .6 : 1 }}
                  disabled={adPending}
                  onClick={() => requestRewardAd("eventDew")}>
                  {adPending ? "広告を読み込み中…（15秒ほどかかります）" : `広告を見て報酬を2倍にする（本日あと${rewardAdUsesLeft(meta)}回）`}
                </button>
              )}
              {!ev.adClaimed && rewardAdFailNote()}
            </div>
          )}
        </div>
      </div>
    );
  }

  const mx = maxHpOf(g);
  const def = armorDef(g);
  const disc = meta.discovered || {};
  const floatsFor = (tid) => g.floats.filter((f) => f.targetId === tid);

  /* ---------- ラン画面 ---------- */
  const nodeLabel = { battle: "戦闘", chest: "宝箱", spring: "泉", boss: "主" };

  return (
    <div className="kw-root">
      <style>{CSS}</style>
      <StageBackdrop floor={g.floor} />
      <div className="kw-vignette" />
      <div className="kw-tate" style={{ position: "fixed", right: 18, top: 90, zIndex: 2 }}>
        {STAGES[stageOf(g.floor)].tate}
      </div>

      <div className="kw-stage">
        {/* ヘッダ */}
        <div className="kw-head">
          <div className="kw-floor">
            <small>{STAGES[stageOf(g.floor)].read}</small>
            {floorLabel(g.floor)}<span style={{ fontSize: 14, color: "var(--mist)", marginLeft: 8 }}>層</span>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="kw-btn ghost" style={{ padding: "4px 10px" }}
                onClick={() => setG((s) => ({ ...s, settingsOpen: true }))}>
                <Settings size={14} />
              </button>
              <button className="kw-btn ghost" style={{ padding: "4px 10px", fontSize: 10, letterSpacing: ".1em" }}
                onClick={() => setG((s) => ({ ...s, bestiary: true }))}>図鑑</button>
              <button className="kw-btn ghost" style={{ padding: "4px 12px", fontSize: 10, letterSpacing: ".1em" }}
                disabled={g.busy}
                onClick={() => setG((s) => ({ ...s, confirm: "title" }))}>タイトルへ</button>
            </div>
            <div className="kw-progress" style={{ justifyContent: "flex-end" }}>
              {g.nodes.map((n, i) => (
                <span key={i} className={`kw-node ${i < g.node ? "done" : i === g.node ? "now" : ""}`} title={nodeLabel[n]} />
              ))}
            </div>
          </div>
        </div>

        {/* フィールド */}
        <div className="kw-field">
          {g.phase === "battle" && (
            <div className="kw-field-inner">
              {g.enemies.map((e) => (
                <EnemyCard key={e.id} e={e} disc={disc} pending={g.pending} hitId={g.hitId} floats={g.floats} onAttack={attackWith} />
              ))}
            </div>
          )}

          {g.phase === "chest" && (
            <div className="kw-field-panel">
              <div className="kw-panel" style={{ padding: "22px 20px", textAlign: "center", maxWidth: 420, width: "100%" }}>
                <Package size={44} color="var(--hotaru)" strokeWidth={1.4} style={{ margin: "0 auto 10px" }} />
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: ".1em" }}>苔むした宝箱</div>
                <div style={{ fontSize: 12, color: "var(--mist)", margin: "8px 0 16px", lineHeight: 1.8 }}>
                  森の誰かが遺していった。良いものが眠っていることが多い。
                </div>
                {!g.eventDone
                  ? <button className="kw-btn primary" onClick={openChest}>開ける</button>
                  : <div className="kw-grid" style={{ justifyItems: "center" }}>
                      {g.drops.map((d) => <ItemCell key={d.id} item={d} onClick={() => takeDrop(d)} actionLabel="拾う" hint={hintFor(d)} />)}
                    </div>}
                <div className="kw-actions sticky" style={{ justifyContent: "center" }}>
                  <button className="kw-btn ghost" onClick={tryProceed}>先へ進む →</button>
                </div>
              </div>
            </div>
          )}

          {g.phase === "spring" && (
            <div className="kw-field-panel">
              <div className="kw-panel" style={{ padding: "22px 20px", textAlign: "center", maxWidth: 420, width: "100%", position: "relative" }}>
                {floatsFor("player").map((f, i, arr) => (
                  <div key={f.key} className="kw-float" style={{ color: f.color, fontSize: f.size, left: `calc(50% + ${floatOffsetX(i, arr.length)}px)` }}>{f.text}</div>
                ))}
                <Moon size={44} color="#9fd4c9" strokeWidth={1.4} style={{ margin: "0 auto 10px" }} />
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: ".1em" }}>月映しの泉</div>
                <div style={{ fontSize: 12, color: "var(--mist)", margin: "8px 0 16px", lineHeight: 1.8 }}>
                  水面に月が揺れている。飲めば傷も毒も流れていく。
                </div>
                {!g.eventDone
                  ? <button className="kw-btn primary" onClick={drinkSpring}>水を飲む(HP50%回復)</button>
                  : g.drops.length > 0 && (
                    <div className="kw-grid" style={{ justifyItems: "center" }}>
                      {g.drops.map((d) => <ItemCell key={d.id} item={d} onClick={() => takeDrop(d)} actionLabel="拾う" hint={hintFor(d)} />)}
                    </div>)}
                <div className="kw-actions sticky" style={{ justifyContent: "center" }}>
                  <button className="kw-btn ghost" onClick={tryProceed}>先へ進む →</button>
                </div>
              </div>
            </div>
          )}

          {g.phase === "reward" && (
            <div className="kw-field-panel">
              <div className="kw-panel" style={{ padding: "20px 18px", textAlign: "center", maxWidth: 560, width: "100%" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: ".2em", color: "var(--hotaru)" }}>勝 利</div>
                <div style={{ fontSize: 12, color: "var(--mist)", margin: "8px 0 14px" }}>
                  {g.drops.length > 0 ? <>森が戦利品を落としていった。<span style={{ marginLeft: 8, color: "var(--paper-dim)" }}>袋 {g.inv.length}/{invCap}</span></> : "今回は何も落ちていないようだ。"}
                </div>
                {g.drops.length > 0 && (
                  <div className="kw-grid">
                    {g.drops.map((d) => <ItemCell key={d.id} item={d} onClick={() => takeDrop(d)} actionLabel="拾う / 装備" hint={hintFor(d)} />)}
                  </div>
                )}
                {g.full && g.inv.length >= invCap && <div className="kw-notice">袋がいっぱいで拾えませんでした。「袋」から不要な物を捨てるか、置いて進みましょう。</div>}
                {g.drops.some((d) => d.itemId === "dew") && !g.dewAdClaimed && rewardAdUsesLeft(meta) > 0 && g.rewardAdFailedAt && (
                  <div style={{ marginTop: 4, marginBottom: 6 }}>
                    <button className="kw-btn ghost" style={{ fontSize: 11 }} disabled={!!g.rewardAdPending}
                      onClick={() => { setG((s) => ({ ...s, rewardAdFailedAt: null })); requestRewardAd("dew"); }}>
                      <Sparkles size={10} style={{ display: "inline", marginRight: 4 }} />
                      {g.rewardAdPending === "dew" ? "読み込み中…（15秒ほどかかります）" : "広告を再試行して雫を2倍にする"}
                    </button>
                    {rewardAdFailNote({ marginTop: 4 })}
                  </div>
                )}
                <div className="kw-actions sticky" style={{ justifyContent: "center" }}>
                  {g.drops.length > 0 && <button className="kw-btn ghost" onClick={takeAllDrops}>全部拾う</button>}
                  <button className="kw-btn primary" onClick={tryProceed}>
                    {g.node + 1 < g.nodes.length ? "先へ進む →" : `${floorLabel(g.floor + 1)} 層へ降りる ↓`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* プレイヤーHUD */}
        <div className="kw-panel kw-hud" style={{ position: "relative" }}>
          {floatsFor("player").filter(() => g.phase === "battle").map((f, i, arr) => (
            <div key={f.key} className="kw-float" style={{ color: f.color, fontSize: f.size, top: -28, left: `calc(50% + ${floatOffsetX(i, arr.length)}px)` }}>{f.text}</div>
          ))}
          <div className="kw-me">旅人</div>
          <div className={`kw-mybar ${g.player.hp / mx < 0.25 ? "low" : ""}`}><i style={{ width: `${(g.player.hp / mx) * 100}%` }} /></div>
          <div className="kw-num">{g.player.hp} / {mx}</div>
          <div className="kw-status">
            {g.player.atkUp > 0 && <span className="kw-tag buff">攻+40% {g.player.atkUp}T</span>}
            {g.player.poison > 0 && <span className="kw-tag bad">毒 {g.player.poison}T</span>}
            {g.player.guard && <span className="kw-tag buff">防御中</span>}
          </div>
        </div>

        {/* 武器の手札 */}
        <div className="kw-hand">
          {g.weapons.map((w, i) => (
            <WeaponCard key={w ? w.id : `slot${i}`} w={w} g={g} onAttack={attackWith}
              onSelect={(wp) => setG((s) => ({ ...s, pending: s.pending?.id === wp.id ? null : wp }))} />
          ))}
        </div>

        {/* 武器スロットが全空 + 袋に武器あり → 装備を促すバナー */}
        {g.phase === "battle" && !g.weapons.some(Boolean) && g.inv.some((x) => x.kind === "weapon") && (
          <div className="kw-notice" style={{ margin: "0 12px" }}>
            武器がありません。「袋」を開けて武器を装備してください。
          </div>
        )}

        {/* 行動サブバー */}
        <div className="kw-subbar">
          {g.phase === "battle" && (
            <>
              {!g.pending && (
                <>
                  <button className="kw-btn ghost" disabled={g.busy} onClick={guard}>防御<span style={{ fontSize: 9, color: "var(--mist)", marginLeft: 3 }}>被ダメ半減</span></button>
                  <button className="kw-btn ghost" disabled={g.busy} onClick={() => setG((s) => ({ ...s, bag: true }))}>
                    袋 ({g.inv.length}/{invCap}){g.inv.length >= invCap ? " 満杯" : ""}
                  </button>
                </>
              )}
              {g.pending && (
                <>
                  <span className="kw-panel kw-hint" style={{ fontSize: 12, color: "var(--hotaru)", letterSpacing: ".05em", padding: "5px 10px", border: "1px solid var(--hotaru-dim)", animation: "kwFade .3s ease" }}>
                    ↑ 狙う敵を選んでください
                  </span>
                  <button className="kw-btn ghost" style={{ padding: "3px 10px", fontSize: 10, flexShrink: 0 }}
                    onClick={() => setG((s) => ({ ...s, pending: null }))}>やめる</button>
                </>
              )}
            </>
          )}
          {g.phase !== "battle" && g.phase !== "dead" && g.phase !== "clear" && (
            <button className="kw-btn ghost" onClick={() => setG((s) => ({ ...s, bag: true }))}
              style={g.inv.length >= invCap ? { borderColor: "var(--danger)", color: "var(--danger)" } : undefined}>
              袋・装備 ({g.inv.length}/{invCap}){g.inv.length >= invCap ? " 満杯" : ""}
            </button>
          )}
        </div>

        {/* ログ(タップで全文をポップアップ表示) */}
        <div className="kw-panel kw-log" ref={logRef} role="button" style={{ cursor: "pointer" }}
          onClick={() => setG((s) => ({ ...s, logPopup: true }))}>
          {g.logs.map((l, i, arr) => (
            <div key={l.k} className={i === arr.length - 1 ? "new" : ""}>
              {l.strong ? <b>{l.text}</b> : l.text}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- ログの拡大ポップアップ ---------- */}
      {g.logPopup && (
        <div className="kw-overlay top" onClick={() => setG((s) => ({ ...s, logPopup: false }))}>
          <div className="kw-panel kw-sheet" style={{ maxWidth: 480, height: "78vh", textAlign: "left", display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px 20px 10px", flexShrink: 0, borderBottom: "1px solid rgba(157,180,166,.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ letterSpacing: ".2em" }}>ログ</h2>
              <button className="kw-btn ghost" style={{ padding: "6px 12px" }}
                onClick={() => setG((s) => ({ ...s, logPopup: false }))}><X size={14} /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "14px 20px", fontSize: 15, lineHeight: 2, color: "var(--paper-dim)" }}>
              {g.logs.length === 0
                ? <div className="kw-sub">ログはまだありません。</div>
                : g.logs.map((l, i, arr) => (
                  <div key={l.k} className={i === arr.length - 1 ? "new" : ""}>
                    {l.strong ? <b>{l.text}</b> : l.text}
                  </div>
                ))}
            </div>
            <div style={{ flexShrink: 0, padding: "8px 18px 12px", display: "flex", justifyContent: "center", borderTop: "1px solid rgba(157,180,166,.08)" }}>
              <button className="kw-btn ghost" style={{ padding: "9px 48px" }}
                onClick={() => setG((s) => ({ ...s, logPopup: false }))}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- 袋オーバーレイ ---------- */}
      {g.bag && (
        <div className="kw-overlay top" onClick={closeBag}>
          <div className="kw-panel kw-sheet" onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
            {/* スクロールしても常に表示される固定ヘッダー */}
            <div style={{ padding: "16px 18px 10px", flexShrink: 0, borderBottom: "1px solid rgba(157,180,166,.12)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2>{g.gearPrep ? "戦闘準備" : "旅の袋"}</h2>
                  <div className="kw-sub">
                    {g.gearPrep
                      ? "この章に入りました。武具を整えてから戦闘を始めましょう。"
                      : g.phase === "battle"
                      ? "戦闘中は回復・バフのみ使用可(1ターン消費)。不要品は「捨てる」で手放せます。"
                      : "消耗品を使う・武具を装備する・不要品は「捨てる」ボタンで手放せます。"}
                  </div>
                </div>
                <button className="kw-btn ghost" style={{ padding: "6px 12px" }} onClick={closeBag}><X size={14} /></button>
              </div>
              {g.bagActionError && <div className="kw-notice" style={{ marginTop: 8 }}>{g.bagActionError}</div>}
              <div style={{ background: "rgba(0,0,0,.28)", borderRadius: 8, padding: "8px 12px", marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "var(--mist)", letterSpacing: ".1em", minWidth: 18 }}>HP</span>
                  <div className={`kw-mybar${g.player.hp / mx < 0.25 ? " low" : ""}`} style={{ flex: 1 }}>
                    <i style={{ width: `${(g.player.hp / mx) * 100}%` }} />
                  </div>
                  <span style={{ fontSize: 13, fontFamily: "var(--font-display)", minWidth: 66, textAlign: "right", color: g.player.hp / mx < 0.25 ? "var(--danger)" : "var(--paper)" }}>
                    {g.player.hp} / {mx}
                  </span>
                </div>
                {(g.player.atkUp > 0 || g.player.poison > 0 || g.player.guard) && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                    {g.player.atkUp > 0 && <span className="kw-tag buff">攻+40% {g.player.atkUp}T</span>}
                    {g.player.poison > 0 && <span className="kw-tag bad">毒 {g.player.poison}T</span>}
                    {g.player.guard && <span className="kw-tag buff">防御中</span>}
                  </div>
                )}
              </div>
            </div>
            {/* スクロール可能なアイテム一覧 */}
            <div style={{ overflowY: "auto", flex: 1, padding: "0 18px 16px" }}>

            {/* 装備の変更(外す・組み替え)は戦闘中には出さない方針。戦闘中に装備を
                変える必要が生じないようにし、組み替えは戦闘の合間に行ってもらう。
                ただし章に入った直後の戦闘準備(gearPrep)は例外的に許可する
                (phase は既に "battle" だが、まだ何も行動していない最初の1戦なので、
                ここで整えてから始めれば「戦闘中に変える」ことにはならない)。 */}
            {(g.phase !== "battle" || g.gearPrep) && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 8px" }}>
                  <div style={{ fontSize: 11, color: "var(--mist)", letterSpacing: ".15em" }}>
                    ── 装備中の武器(タップで外す)
                  </div>
                  <button className="kw-btn ghost"
                    style={{ padding: "3px 10px", fontSize: 10, flexShrink: 0 }}
                    onClick={() => { setReorderSel(null); setReorderPopup(true); }}>
                    並び替え
                  </button>
                </div>
                <div className="kw-grid">
                  {g.weapons.map((w, i) => w
                    ? <div key={w.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <ItemCell item={w} equipped onClick={() => unequipWeapon(i)} />
                        <button className={`kw-btn ${w.locked ? "primary" : "ghost"}`}
                          style={{ padding: "4px 0", fontSize: 10, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                          onClick={(e) => { e.stopPropagation(); toggleLock(w); }}>
                          {w.locked ? <><Lock size={11} />ロック中</> : <><LockOpen size={11} />ロック</>}
                        </button>
                      </div>
                    : <div key={i} className="kw-panel kw-cell" style={{ opacity: .3, cursor: "default" }}>
                        <div className="kw-cmeta">空きスロット</div>
                      </div>)}
                </div>
                <div style={{ fontSize: 11, color: "var(--mist)", letterSpacing: ".15em", margin: "12px 0 8px" }}>── 防具(タップで外す)</div>
                <div className="kw-grid">
                  {Object.entries(ARMOR_TYPES).map(([slot, a]) => g.armor[slot]
                    ? <div key={slot} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <ItemCell item={g.armor[slot]} equipped onClick={() => unequipArmor(slot)} />
                        <button className={`kw-btn ${g.armor[slot].locked ? "primary" : "ghost"}`}
                          style={{ padding: "4px 0", fontSize: 10, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                          onClick={(e) => { e.stopPropagation(); toggleLock(g.armor[slot]); }}>
                          {g.armor[slot].locked ? <><Lock size={11} />ロック中</> : <><LockOpen size={11} />ロック</>}
                        </button>
                      </div>
                    : <div key={slot} className="kw-panel kw-cell" style={{ opacity: .3, cursor: "default" }}><div className="kw-cmeta">{a.label}: なし</div></div>)}
                </div>
              </>
            )}
            <div className="kw-divider" />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, margin: "4px 0 8px" }}>
              <div style={{ fontSize: 11, color: "var(--mist)", letterSpacing: ".15em" }}>── 袋の中身 ({g.inv.length}/{invCap})</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 3 }}>
                  <button className={`kw-btn ${(meta.bagSortMode || "type") === "type" ? "primary" : "ghost"}`}
                    style={{ padding: "3px 9px", fontSize: 10 }}
                    onClick={() => setBagSortMode("type")}>種類順</button>
                  <button className={`kw-btn ${meta.bagSortMode === "acquired" ? "primary" : "ghost"}`}
                    style={{ padding: "3px 9px", fontSize: 10 }}
                    onClick={() => setBagSortMode("acquired")}>入手順</button>
                </div>
                {(meta.dewBank || 0) > 0 && (
                  <button className="kw-btn ghost" style={{ padding: "3px 10px", fontSize: 10 }}
                    onClick={() => setG((s) => ({ ...s, skillTree: true }))}>
                    <Sparkles size={10} style={{ display: "inline", marginRight: 3 }} />スキルツリー {meta.dewBank}個
                  </button>
                )}
              </div>
            </div>
            {g.inv.length === 0 && <div className="kw-sub">袋は空です。森で拾い集めましょう。</div>}
            {(() => {
              const inBattle = g.phase === "battle" && !g.gearPrep;
              const sortForDisplay = (arr) => (meta.bagSortMode || "type") === "acquired" ? arr : [...arr].sort(bagSortByType);
              const catLabel = (label) => (
                <div style={{ fontSize: 10, color: "var(--mist)", letterSpacing: ".2em", margin: "8px 0 5px", opacity: .75 }}>── {label}</div>
              );
              const handleDiscard = (e, it) => {
                e.stopPropagation();
                if (isItemProtected(it)) return; // ロック中は捨てられない
                if (isRareItem(it)) { setDiscardConfirm(it); } else { discardItem(it); }
              };
              // ロック切替 + 捨てるボタン(ロック中は無効表示。鍵アイコンで再度解除できる)
              const itemActions = (it) => {
                const locked = !!it.locked;
                return (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className={`kw-btn ${locked ? "primary" : "ghost"}`}
                      style={{ padding: "5px 8px", fontSize: 11, flexShrink: 0, display: "inline-flex", alignItems: "center" }}
                      onClick={(e) => { e.stopPropagation(); toggleLock(it); }}>
                      {locked ? <Lock size={12} /> : <LockOpen size={12} />}
                    </button>
                    <button className="kw-btn ghost" disabled={locked}
                      style={{ padding: "5px 0", fontSize: 11, flex: 1, letterSpacing: ".12em",
                               opacity: locked ? 0.45 : 1 }}
                      onClick={(e) => handleDiscard(e, it)}>
                      {locked ? "ロック中" : "捨てる"}
                    </button>
                  </div>
                );
              };
              const renderEquip = (it) => {
                // 戦闘中は装備を変えられないが、章開始直後の戦闘準備(gearPrep)は例外(外した武器を付け直せる)。
                if (inBattle) return <ItemCell key={it.id} item={it} onClick={() => {}} />;
                return (
                  <div key={it.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <ItemCell item={it} actionLabel="装備する" onClick={() => equipItem(it)} hint={hintFor(it)} />
                    {itemActions(it)}
                  </div>
                );
              };
              const renderConsumable = (it) => {
                const c = CONSUMABLES[it.itemId];
                const mx = maxHpOf(g);
                const hpFull = g.player.hp >= mx;
                const poisoned = g.player.poison > 0;
                let canUseNow = inBattle ? c?.kind !== "orb" && c?.kind !== "metaHp" : c?.kind !== "bomb";
                let disabledLabel = inBattle ? "戦闘後のみ" : "戦闘中のみ";
                if (c?.kind === "heal" && hpFull) { canUseNow = false; disabledLabel = "HP満タン"; }
                else if (c?.kind === "cure" && hpFull && !poisoned) { canUseNow = false; disabledLabel = "HP満タン・毒なし"; }
                return (
                  <div key={it.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {canUseNow
                      ? <ItemCell item={it} actionLabel="使う" onClick={() => useItem(it)} />
                      : <ItemCell item={it} actionLabel={disabledLabel} onClick={() => {}} />
                    }
                    {c?.kind === "bomb" && (
                      <div style={{ fontSize: 10, color: "var(--hotaru)", textAlign: "center", letterSpacing: ".05em" }}>
                        現在の威力: 敵全体に{bombPowerAt(g.floor)}
                      </div>
                    )}
                    {itemActions(it)}
                  </div>
                );
              };
              const weapons  = sortForDisplay(g.inv.filter(it => it.kind === "weapon"));
              const armors   = sortForDisplay(g.inv.filter(it => it.kind === "armor"));
              const heals    = sortForDisplay(g.inv.filter(it => it.kind === "item" && ["heal","cure"].includes(CONSUMABLES[it.itemId]?.kind)));
              const buffs    = sortForDisplay(g.inv.filter(it => it.kind === "item" && CONSUMABLES[it.itemId]?.kind === "buff"));
              const attacks  = sortForDisplay(g.inv.filter(it => it.kind === "item" && CONSUMABLES[it.itemId]?.kind === "bomb"));
              const specials = sortForDisplay(g.inv.filter(it => it.kind === "item" && ["orb","metaHp"].includes(CONSUMABLES[it.itemId]?.kind)));
              return (
                <>
                  {weapons.length  > 0 && <>{catLabel("武器")}<div className="kw-grid">{weapons.map(renderEquip)}</div></>}
                  {armors.length   > 0 && <>{catLabel("防具")}<div className="kw-grid">{armors.map(renderEquip)}</div></>}
                  {heals.length    > 0 && <>{catLabel("回復")}<div className="kw-grid">{heals.map(renderConsumable)}</div></>}
                  {buffs.length    > 0 && <>{catLabel("バフ")}<div className="kw-grid">{buffs.map(renderConsumable)}</div></>}
                  {attacks.length  > 0 && <>{catLabel("攻撃")}<div className="kw-grid">{attacks.map(renderConsumable)}</div></>}
                  {specials.length > 0 && <>{catLabel("特殊")}<div className="kw-grid">{specials.map(renderConsumable)}</div></>}
                </>
              );
            })()}
            </div>
            {/* 画面下部に固定するフッター(スクロールと無関係に常に見える)。 */}
            {g.gearPrep && (
              <div style={{ flexShrink: 0, padding: "18px 18px", borderTop: "1px solid rgba(157,180,166,.12)" }}>
                <button className="kw-btn primary" style={{ width: "100%", padding: "12px 0" }}
                  onClick={closeBag}>
                  戦闘を始める →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- 武器の並び替えポップアップ(武器だけ・スクロール無し) ---------- */}
      {g.bag && reorderPopup && (
        <div className="kw-overlay top" style={{ zIndex: 55 }} onClick={() => { setReorderPopup(false); setReorderSel(null); }}>
          <div className="kw-panel kw-sheet" style={{ maxWidth: 420, textAlign: "left" }} onClick={(e) => e.stopPropagation()}>
            <h2>武器の並び替え</h2>
            <div className="kw-sub">入れ替えたい武器を2つ順にタップ、または別の武器の上へドラッグしてください。</div>
            <div className="kw-grid">
              {g.weapons.map((w, i) => {
                const dragging = popDrag && popDrag.idx === i && (Math.abs(popDrag.dx) + Math.abs(popDrag.dy) > 10);
                const isOver = popDrag && popDrag.over === i;
                return (
                  <div key={i} ref={(el) => { popSlotRefs.current[i] = el; }}
                    style={{ borderRadius: 10, touchAction: "none", position: "relative", zIndex: dragging ? 5 : undefined,
                      transform: dragging ? `translate(${popDrag.dx}px, ${popDrag.dy}px) scale(1.05)` : undefined,
                      transition: dragging ? "none" : "transform .15s ease",
                      boxShadow: (reorderSel === i || isOver) ? "0 0 0 2px var(--hotaru)" : undefined }}
                    onPointerDown={(e) => popDragStart(e, i)}
                    onPointerMove={popDragMove}
                    onPointerUp={popDragEnd}
                    onPointerCancel={() => setPopDrag(null)}>
                    {w
                      ? <ItemCell item={w} equipped onClick={() => {}} />
                      : <div className="kw-panel kw-cell" style={{ opacity: .5, cursor: "pointer" }}>
                          <div className="kw-cmeta">空きスロット</div>
                        </div>}
                  </div>
                );
              })}
            </div>
            <div className="kw-actions" style={{ justifyContent: "center" }}>
              <button className="kw-btn ghost" style={{ padding: "9px 48px" }}
                onClick={() => { setReorderPopup(false); setReorderSel(null); }}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- 力尽きた直後: 広告視聴で復活するか選ぶ ---------- */}
      {g.phase === "reviveOffer" && (
        <div className="kw-overlay">
          <div className="kw-panel kw-sheet" style={{ textAlign: "center", maxWidth: 340 }}>
            <h2 style={{ color: "var(--danger)" }}>力尽きかけている……</h2>
            <div className="kw-sub" style={{ marginTop: 10 }}>
              広告を見ると、HP満タンでこの場に踏みとどまれる。<br />
              この転生で<b style={{ color: "var(--hotaru)" }}>1度だけ</b>使えます。
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              <button className="kw-btn primary" style={{ fontSize: 12 }}
                disabled={!!g.rewardAdPending} onClick={() => requestRewardAd("revive")}>
                {g.rewardAdPending === "revive" ? "広告を読み込み中…（15秒ほどかかります）" : "広告を見て復活する"}
              </button>
              <button className="kw-btn ghost" style={{ fontSize: 12 }}
                onClick={() => finalizeDeath(g)}>あきらめる</button>
            </div>
            {rewardAdFailNote({ marginTop: 10 })}
          </div>
        </div>
      )}

      {/* ---------- 死 → 魂の継承 ---------- */}
      {g.phase === "dead" && (() => {
        const stageOptions = rebirthStageOptions(meta);
        const chosenStage = stageOptions.includes(g.rebirthStage) ? g.rebirthStage : stageOptions[stageOptions.length - 1];
        return (
        <div className="kw-overlay">
          <div className="kw-panel kw-sheet">
            <h2 style={{ color: "var(--danger)" }}>旅人は倒れた</h2>
            <div className="kw-sub">
              しかし魂は森を巡り、また灯りの下へ還る。<br />
              <b style={{ color: "var(--hotaru)" }}>継承枠 {g.effSlots ?? meta.slots} つ</b>まで、次の生へ持ち越す品を選べます。ロック中のアイテムは優先的に選ばれますが、枠を超えた分は他と同様に持ち越せません。{(g.effSlots ?? meta.slots) > meta.slots ? <span style={{ color: "var(--hotaru)", fontSize: 10 }}>（宝珠+{(g.effSlots ?? meta.slots) - meta.slots}）</span> : ""}<br />
              精の結晶: <b style={{ color: "var(--hotaru)" }}>{meta.dewBank || 0}</b> 個 — スキルツリーで永続スキルを習得できます。<br />
              <span style={{ fontSize: 10.5 }}>宝樹の雫は持ち越せません。選ぶとその場で精の結晶に変わります。</span>
            </div>
            {stageOptions.length > 1 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10.5, color: "var(--mist)", letterSpacing: ".15em", marginBottom: 6 }}>── 再開する章を選ぶ ──</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {stageOptions.map((i) => (
                    <button key={i}
                      className={`kw-btn ${chosenStage === i ? "primary" : "ghost"}`}
                      style={{ padding: "6px 12px", fontSize: 11.5 }}
                      onClick={() => setG((s) => ({ ...s, rebirthStage: i }))}>
                      第{i + 1}章 {STAGES[i].name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="kw-grid" style={{ marginTop: 12 }}>
              {allOwned(g).map((it) => {
                const isDewItem = it.kind === "item" && it.itemId === "dew";
                const picked = g.pick.includes(it.id);
                return (
                  <ItemCell key={it.id} item={it} picked={picked} onClick={() => togglePick(it)}
                    actionLabel={isDewItem
                      ? (picked ? "✓ 結晶にする" : "タップで結晶化")
                      : (picked ? (it.locked ? "🔒✓ 持っていく" : "✓ 持っていく") : (it.locked ? "🔒 タップで選ぶ" : "タップで選ぶ"))} />
                );
              })}
            </div>
            {/* 武器を選んでいない場合の自動継承注記 */}
            {allOwned(g).some((x) => x.kind === "weapon") &&
              !g.pick.some((id) => allOwned(g).find((x) => x.id === id)?.kind === "weapon") && (
              <div className="kw-notice" style={{ borderColor: "rgba(255,255,255,.12)", color: "var(--mist)" }}>
                武器を選んでいません。転生すると最も強い武器が自動で引き継がれます。
              </div>
            )}
            <div className="kw-actions sticky">
              <div style={{ alignSelf: "center", fontSize: 12, color: g.pick.length >= (g.effSlots ?? meta.slots) ? "var(--hotaru)" : "var(--mist)", marginRight: "auto" }}>
                選択 {g.pick.length} / {g.effSlots ?? meta.slots}
              </div>
              {(meta.dewBank || 0) > 0 && (
                <button className="kw-btn ghost" onClick={() => setG((s) => ({ ...s, skillTree: true }))}>
                  <Sparkles size={11} style={{ display: "inline", marginRight: 4 }} />スキルツリー ({meta.dewBank}個)
                </button>
              )}
              <button className="kw-btn ghost" onClick={() => setG((s) => ({ ...s, pick: [] }))}>全て外す</button>
              <button className="kw-btn primary" onClick={rebirth}>
                {g.pick.length > 0 ? `${g.pick.length}点と共に、生まれ変わる` : "何も持たずに、生まれ変わる"}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ---------- 章クリア(旅は続く) ---------- */}
      {g.phase === "clear" && (
        <div className="kw-overlay">
          <div className="kw-panel kw-sheet" style={{ textAlign: "center" }}>
            <div style={{ margin: "6px 0 4px" }}><Star size={30} color="var(--hotaru)" strokeWidth={1.4} /></div>
            <h2 style={{ letterSpacing: ".3em" }}>第{stageOf(g.floor) + 1}章 了</h2>
            <div className="kw-sub" style={{ marginTop: 10 }}>
              {STAGES[stageOf(g.floor)].boss.name}は道を譲った。<br />
              霧の向こうに、第{stageOf(g.floor) + 2}章「{STAGES[Math.min(9, stageOf(g.floor) + 1)].name}」への降り口が見えている。<br /><br />
              <b style={{ color: "var(--hotaru)" }}>報酬:</b> 以後、死んでもこの先の章から再開できる ／ 主の戦利品
            </div>
            <div className="kw-grid" style={{ textAlign: "left" }}>
              {g.drops.map((d) => <ItemCell key={d.id} item={d} onClick={() => takeDrop(d)} actionLabel="拾う / 装備" hint={hintFor(d)} />)}
            </div>
            {g.full && g.inv.length >= invCap && <div className="kw-notice">袋がいっぱいで拾えませんでした。「袋を整理」から不要な物を捨ててください。</div>}
            <div className="kw-actions sticky" style={{ justifyContent: "center" }}>
              {g.drops.length > 0 && <button className="kw-btn ghost" onClick={takeAllDrops}>全部拾う</button>}
              <button className="kw-btn ghost" onClick={() => setG((s) => ({ ...s, bag: true }))}
                style={g.inv.length >= invCap ? { borderColor: "var(--danger)", color: "var(--danger)" } : undefined}>
                袋を整理 ({g.inv.length}/{invCap}){g.inv.length >= invCap ? " 満杯" : ""}
              </button>
              <button className="kw-btn primary" onClick={tryProceed}>
                第{stageOf(g.floor) + 2}章へ降りる ↓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- 進行前の確認(拾い忘れ・未開封) ---------- */}
      {g.confirm === "drops" && g.drops.length > 0 && (
        <div className="kw-overlay top" onClick={() => setG((s) => ({ ...s, confirm: null }))}>
          <div className="kw-panel kw-sheet" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "var(--hotaru)" }}>拾い忘れがあります</h2>
            <div className="kw-sub">
              まだ手にしていない戦利品が <b style={{ color: "var(--hotaru)" }}>{g.drops.length} 点</b> あります。
              置いていくと二度と拾えません。<span style={{ color: "var(--paper-dim)" }}>(袋 {g.inv.length}/{invCap})</span>
            </div>
            <div className="kw-grid">
              {g.drops.map((d) => <ItemCell key={d.id} item={d} onClick={() => takeDrop(d)} actionLabel="拾う" hint={hintFor(d)} />)}
            </div>
            {g.full && g.inv.length >= invCap && <div className="kw-notice">袋がいっぱいで拾えませんでした。一度戻って「袋」から整理するか、置いていきましょう。</div>}
            <div className="kw-actions">
              <button className="kw-btn ghost" style={{ marginRight: "auto" }} onClick={() => setG((s) => ({ ...s, confirm: null }))}>← 戻る</button>
              <button className="kw-btn primary" onClick={proceedLeaving}>置いて進む →</button>
            </div>
          </div>
        </div>
      )}
      {g.confirm === "event" && (
        <div className="kw-overlay top" onClick={() => setG((s) => ({ ...s, confirm: null }))}>
          <div className="kw-panel kw-sheet" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "var(--hotaru)" }}>{g.phase === "chest" ? "宝箱を開けていません" : "泉の水を飲んでいません"}</h2>
            <div className="kw-sub">
              {g.phase === "chest"
                ? "開けずに進むと、中身は手に入りません。良い装備が眠っていることが多い場所です。"
                : "飲まずに進むと、回復の機会を失います(HP50%回復+毒消し)。"}
            </div>
            <div className="kw-actions">
              <button className="kw-btn primary" style={{ marginRight: "auto" }} onClick={() => setG((s) => ({ ...s, confirm: null }))}>
                ← 戻って{g.phase === "chest" ? "開ける" : "飲む"}
              </button>
              <button className="kw-btn ghost" onClick={proceedLeaving}>このまま進む →</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- 初回チュートリアル(全画面) ---------- */}
      {g.coach && g.phase === "battle" && (
        <div className="kw-overlay">
          <div className="kw-panel kw-sheet" style={{ maxWidth: 520, textAlign: "left" }}>
            <h2 style={{ letterSpacing: ".2em" }}>森へようこそ</h2>
            <div className="kw-sub" style={{ fontSize: 13, lineHeight: 2, marginTop: 8 }}>
              下の<b style={{ color: "var(--paper)" }}>武器カード</b>をタップして攻撃します。全体攻撃(本・楽器)はすぐ発動、単体攻撃は続けて狙う敵をタップします。<br /><br />
              武器には <b style={{ color: "var(--paper)" }}>斬・突・打・魔・音</b> の属性があります。<b style={{ color: "var(--hotaru)" }}>「弱点をつける!」</b> が光る敵には1.6倍のダメージ、耐性持ちには0.5倍になります。手こずる敵が出たら、別の属性の武器を探しましょう。<br /><br />
              <b style={{ color: "var(--paper)" }}>防御</b>ボタンで構えると次の敵の攻撃ダメージが半減します。<b style={{ color: "var(--paper)" }}>袋</b>から回復アイテムも使えます(1ターン消費)。<br /><br />
              倒れても選んだ装備は次の生へ受け継がれ、到達済みの章から再開できます。恐れず挑みましょう。
            </div>
            <div className="kw-actions" style={{ justifyContent: "center" }}>
              <button className="kw-btn primary" style={{ padding: "10px 30px" }} onClick={() => setG((s) => ({ ...s, coach: false }))}>はじめる</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- 百層踏破 — エンディング ---------- */}
      {g.phase === "ending" && (
        <div className="kw-overlay">
          <div className="kw-panel kw-sheet" style={{ textAlign: "center" }}>
            <div style={{ margin: "6px 0 4px" }}><Sun size={30} color="var(--hotaru)" strokeWidth={1.4} /></div>
            <h2 style={{ letterSpacing: ".3em" }}>霧 は 晴 れ た</h2>
            <div className="kw-credits">
              <div className="kw-credits-inner">
                <h3>─ 終章 ─</h3>
                常夜の根王が崩れ落ちたとき、<br />
                百層の底に、はじめて朝の光が差した。<br /><br />
                森も、湿原も、遺跡も、花の谷も。<br />
                水晶洞の輝きも、焔の峠の熱も、<br />
                氷樹の静けさも、雷雲の咆哮も、星降りの夜も。<br />
                すべては一本の大樹の、長い長い根だった。<br /><br />
                旅人は幾度も倒れ、幾度も生まれ変わった。<br />
                手に馴染んだ武器だけが、その旅の記憶である。<br /><br />
                <h3>─ 旅の記録 ─</h3>
                転生した回数 …… {meta.deaths} 回<br />
                魂の継承枠 …… {meta.slots}<br />
                百層踏破 …… {meta.clears} 回<br /><br />
                <h3>ダンジョンローグ</h3>
                完<br /><br />
                ──蛍はまだ、森のどこかで灯っている。<br />
                (継承品を携えて、もう一度最初から旅ができます)
              </div>
            </div>
            <div className="kw-actions" style={{ justifyContent: "center" }}>
              <button className="kw-btn primary" onClick={() => {
                updateMeta((m) => ({ ...m, checkpoint: 1 }));
                setG({ screen: "title" });
              }}>森の入り口へ帰る</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- 章の扉(新しい章に入ると表示するタイトル演出) ---------- */}
      {g.stageIntro != null && (
        <div className="kw-overlay" style={{ zIndex: 45 }}
          onClick={() => setG((s) => ({ ...s, stageIntro: null }))}>
          <div style={{ textAlign: "center", maxWidth: 560, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: "var(--mist)", letterSpacing: ".5em", textIndent: ".5em", fontSize: 13, marginBottom: 16 }}>
              {STAGES[g.stageIntro].read}
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(34px, 8vw, 60px)", letterSpacing: ".28em", textIndent: ".28em", lineHeight: 1.3, textShadow: "0 0 40px rgba(232,180,74,.28)" }}>
              {STAGES[g.stageIntro].name}
            </h1>
            <div style={{ color: "var(--paper-dim)", fontSize: 12.5, lineHeight: 2, marginTop: 14 }}>
              第{g.stageIntro + 1}章<br />
              {g.stageIntro === 0
                ? "旅の始まり。灯りを頼りに、霧の奥へ。"
                : `${STAGES[g.stageIntro - 1].name}を越え、新たな地へ足を踏み入れる。`}
            </div>
            <button className="kw-btn primary" style={{ marginTop: 26, padding: "12px 44px", fontSize: 15 }}
              onClick={() => setG((s) => ({ ...s, stageIntro: null, bag: true, gearPrep: true }))}>
              踏 み 入 れ る
            </button>
          </div>
        </div>
      )}

      {/* ---------- タイトルへ戻る確認 ---------- */}
      {g.confirm === "title" && (
        <div className="kw-overlay top" onClick={() => setG((s) => ({ ...s, confirm: null }))}>
          <div className="kw-panel kw-sheet" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "var(--hotaru)" }}>冒険を中断しますか?</h2>
            <div className="kw-sub">
              現在の状態を中断セーブしてタイトルへ戻ります。<br />
              タイトルから「再開」を選ぶと同じ場所から続けられます。
            </div>
            <div className="kw-actions">
              <button className="kw-btn ghost" style={{ marginRight: "auto" }} onClick={() => setG((s) => ({ ...s, confirm: null }))}>← 続ける</button>
              <button className="kw-btn primary" onClick={() => {
                const aliveEnemies = (g.enemies || []).filter((e) => e.hp > 0);
                // S-3: 章クリア/戦利品画面(未回収の確定ドロップが残っている)で中断すると、
                // rewardPhase/drops を渡し忘れて確定報酬(伝説装備・苔の心臓・宝樹の雫等)が
                // 消えていた。"clear"(章ボス)だけでなく "reward"(通常/レア敵撃破)も対象にする。
                const rewardPhase = hasUncollectedReward(g.phase) ? g.phase : null;
                const drops = hasUncollectedReward(g.phase) ? g.drops : null;
                const rd = { floor: g.floor, node: g.node || 0, player: g.player, weapons: g.weapons, armor: g.armor, inv: g.inv, cds: g.cds || {}, lastRareSeen: g.lastRareSeen || 0, orbBagBonus: g.orbBagBonus || 0, enemies: aliveEnemies, rewardPhase, drops };
                saveRun(g.floor, g.node || 0, g.player, g.weapons, g.armor, g.inv, g.cds, g.lastRareSeen, g.orbBagBonus || 0, aliveEnemies, rewardPhase, drops);
                setSavedRun(rd);
                setG({ screen: "title" });
              }}>中断してタイトルへ</button>
            </div>
          </div>
        </div>
      )}
      {/* ---------- 雫広告オファー ---------- */}
      {g.phase === "reward" && g.dewAdOffer && rewardAdUsesLeft(meta) > 0 && (
        <div className="kw-overlay top">
          <div className="kw-panel kw-sheet" style={{ maxWidth: 300, textAlign: "center" }}>
            <div style={{ fontSize: 26 }}>✨</div>
            <h3 style={{ color: "var(--hotaru)", letterSpacing: ".2em", margin: "8px 0 4px", fontSize: 16 }}>宝 樹 の 雫</h3>
            <div style={{ fontSize: 12.5, color: "var(--mist)", lineHeight: 1.9, marginBottom: 16 }}>
              広告を視聴すると、雫をもう1個もらえます。<br />
              <span style={{ fontSize: 10.5, color: "var(--paper-dim)" }}>本日あと{rewardAdUsesLeft(meta)}回</span>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="kw-btn primary" style={{ padding: "10px 20px", fontSize: 12.5 }}
                disabled={!!g.rewardAdPending}
                onClick={() => { setG((s) => ({ ...s, dewAdOffer: false })); requestRewardAd("dew"); }}>
                {g.rewardAdPending === "dew" ? "読み込み中…（15秒ほど）" : "広 告 を 見 る"}
              </button>
              <button className="kw-btn ghost" style={{ fontSize: 12 }}
                onClick={() => setG((s) => ({ ...s, dewAdOffer: false }))}>
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- 武器の交代先選択 ---------- */}
      {g.pendingWeaponSwap && (
        <div className="kw-overlay top">
          <div className="kw-panel kw-sheet" style={{ maxWidth: 420, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "var(--hotaru)", fontSize: 17 }}>どの武器と交代しますか？</h2>
            <div style={{ margin: "6px 0 14px" }}>
              <RarityName item={g.pendingWeaponSwap} small />
              <div style={{ fontSize: 14, color: "var(--paper)", marginTop: 4, letterSpacing: ".05em" }}>{g.pendingWeaponSwap.name}</div>
              <div style={{ fontSize: 11, color: "var(--mist)", marginTop: 6 }}>武器スロットに空きがありません。手放す武器を選んでください。</div>
            </div>
            <div className="kw-grid">
              {/* ロックは「捨てる」操作だけをブロックするためのもので、装備の交代までは
                  妨げない(ステージが進むほど高レア品でも見劣りしていくため)。ロック中の
                  武器も選べるが、🔒 マークだけは目印として残す。 */}
              {g.weapons.map((w, i) => w && (
                <ItemCell key={w.id} item={w} equipped
                  actionLabel={w.locked ? "🔒 これと交代する" : "これと交代する"}
                  onClick={() => confirmWeaponSwap(i)} />
              ))}
            </div>
            <div className="kw-actions" style={{ justifyContent: "center", marginTop: 14 }}>
              <button className="kw-btn ghost" onClick={cancelWeaponSwap}>← キャンセル</button>
            </div>
          </div>
        </div>
      )}
      {/* ---------- レアアイテム捨て確認 ---------- */}
      {discardConfirm && (
        <div className="kw-overlay top">
          <div className="kw-panel kw-sheet" style={{ maxWidth: 340, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "var(--danger)", fontSize: 17 }}>本当に捨てますか？</h2>
            <div style={{ margin: "10px 0 4px" }}>
              <RarityName item={discardConfirm} />
              <div style={{ fontSize: 14, color: "var(--paper)", marginTop: 4, letterSpacing: ".05em" }}>{discardConfirm.name}</div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--mist)", margin: "10px 0 18px", lineHeight: 1.7 }}>
              捨てたアイテムは取り戻せません。
            </div>
            <div className="kw-actions" style={{ justifyContent: "center" }}>
              <button className="kw-btn ghost" style={{ marginRight: "auto" }}
                onClick={() => setDiscardConfirm(null)}>← キャンセル</button>
              <button className="kw-btn" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                onClick={() => { discardItem(discardConfirm); setDiscardConfirm(null); }}>
                捨てる
              </button>
            </div>
          </div>
        </div>
      )}

      {g.settingsOpen && (
        <SettingsOverlay
          onClose={() => setG((s) => ({ ...s, settingsOpen: false }))}
          bgmVolume={bgmVolume} seVolume={seVolume}
          changeBgmVolume={changeBgmVolume} changeSeVolume={changeSeVolume}
          sleepDisabled={sleepDisabled} toggleSleep={toggleSleep}
          openURL={openURL}
          manageConsent={manageConsent} consentApplicable={consentApplicable}
          meta={meta} toggleMetaFlag={toggleMetaFlag}
          cssClass="top"
        />
      )}
      {g.skillTree && (
        <SkillTreeOverlay meta={meta} onClose={() => setG((s) => ({ ...s, skillTree: false }))} onBuy={buySkill} onDismissRefund={dismissRefundNotice} />
      )}
      {g.bestiary && (
        <BestiaryOverlay meta={meta} onClose={() => setG((s) => ({ ...s, bestiary: false }))} />
      )}
      {g.orbChoice && (
        <div className="kw-overlay top">
          <div className="kw-panel kw-sheet" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,180,74,.25), transparent 70%)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={18} color="var(--hotaru)" strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--hotaru)" }}>宝樹の雫</div>
                <div style={{ fontSize: 10, color: "var(--mist)", marginTop: 2 }}>使いみちを選んでください</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="kw-btn ghost" style={{ textAlign: "left", padding: "12px 14px" }}
                onClick={() => resolveOrbChoice("slot")}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--paper)" }}>継承枠 +1</div>
                <div style={{ fontSize: 10, color: "var(--mist)", marginTop: 3 }}>転生時に引き継げるアイテム数が増える。現在 {meta.slots || 0} 枠。</div>
              </button>
              <button className="kw-btn ghost" style={{ textAlign: "left", padding: "12px 14px" }}
                onClick={() => resolveOrbChoice("crystal")}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--paper)" }}>精の結晶 +1</div>
                <div style={{ fontSize: 10, color: "var(--mist)", marginTop: 3 }}>スキルツリーの習得に使える結晶に変換する。現在 {meta.dewBank || 0} 個。</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
