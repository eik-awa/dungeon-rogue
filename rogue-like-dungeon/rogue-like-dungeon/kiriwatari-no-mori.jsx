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
  Settings, ExternalLink,
  Cat, Fish, Rabbit, Dog, Squirrel,
  Bot, Scale, EyeClosed, PiggyBank, Atom, Baby, Flower, Dna, Fan, Pyramid, Cherry, Origami, Egg, Snail, Disc2, Turtle, Shrimp,
} from "lucide-react";


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
  enchantedRabbit: { icon: Rabbit, img: null },
  bogFish:    { icon: Fish,        img: null },
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
    enemies: ["starSlime", "meteorBug", "starCore", "paperCrane", "nightHerald", "silentShade"],
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

// メタ依存の派生値
function weaponSlotsOf(m) {
  const s = m?.skills || {};
  return 3 + (s.weaponSlot4 ? 1 : 0) + (s.weaponSlot5 ? 1 : 0) + (s.weaponSlot6 ? 1 : 0);
}
function invCapOf(m, runBonus = 0) {
  const s = m?.skills || {};
  return 14 + (s.bagCapI ? 5 : 0) + (s.bagCapII ? 5 : 0) + runBonus;
}
function rareChanceOf(m) {
  return 0.08 + ((m?.skills?.goldSense) ? 0.04 : 0);
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
  const atk = Math.max(2, Math.round(t.base * rar.mult * (1 + floor * 0.09) * rnd(0.92, 1.08)));
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
  const def = Math.round(a.baseDef * rar.mult + floor * 0.25);
  const hp = Math.round(a.baseHp * rar.mult * (1 + floor * 0.06));
  return {
    id: uid(), kind: "armor", slot, name: ARMOR_NAMES[slot][idx],
    rarity: rar.id, def, hp, asset: a.asset,
  };
}

function makeConsumable(idOverride) {
  const table = [
    ["berrySmall", 34], ["antidote", 16], ["spore", 16], ["bomb", 18], ["berryBig", 16],
  ];
  let id = idOverride;
  if (!id) {
    const total = table.reduce((a, [, w]) => a + w, 0);
    let roll = Math.random() * total;
    for (const [cid, w] of table) { roll -= w; if (roll <= 0) { id = cid; break; } }
  }
  const c = CONSUMABLES[id];
  return { id: uid(), kind: "item", itemId: id, name: c.label, rarity: id === "dew" || id === "mossHeart" ? "legend" : "common", asset: c.asset };
}

// 敵の生成 (floor: 1〜100 の絶対階層)
function makeEnemy(bookId, floor) {
  const b = ENEMY_BOOK[bookId];
  const hp = Math.round((15 + floor * 8) * b.hpK * rnd(0.9, 1.1));
  const atk = Math.round((4 + floor * 1.2) * b.atkK);
  return {
    id: uid(), bookId, name: b.name, asset: b.asset,
    hp, maxHp: hp, atk, def: b.def + Math.floor(floor / 12),
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
  const hp = Math.round((15 + floor * 8) * (3.2 + sIdx * 0.5));
  const atk = Math.round((4 + floor * 1.2) * 1.3);
  return {
    id: uid(), bookId: B.id, name: B.name, asset: B.asset,
    hp, maxHp: hp, atk, def: 3 + sIdx * 2,
    weak: B.weak, resist: B.resist,
    rare: false, boss: true, atkDown: 0, charge: false,
    poison: !!B.poison, drain: false,
    summons: B.summons, chargeLine: B.chargeLine, bigLine: B.bigLine, summonLine: B.summonLine,
    final: !!B.final,
  };
}

// フロアごとの出現テーブル(章の進みに応じて敵種と数が増える)
// lastRareSeen: 直近で金枝の精を目撃したフロア番号(連続出現を防ぐ)
const RARE_COOLDOWN = 7; // この階数は金枝の精が出現しない
function enemiesForEncounter(floor, lastRareSeen = 0, rareChance = 0.08) {
  const stage = STAGES[stageOf(floor)];
  const fis = floorInStage(floor);
  // プールは最低3体から開始し、2フロアごとに1体解放(全体上限まで)
  const poolSize = Math.min(stage.enemies.length, 3 + Math.floor(fis / 2));
  const avail = stage.enemies.slice(0, poolSize);
  let count = fis <= 2 ? ri(1, 2) : fis <= 5 ? 2 : ri(2, 3);
  if (stageOf(floor) >= 3) count = Math.max(count, 2);
  // シャッフルして順番に取ることで同一フロアでの重複を減らす
  const shuffled = [...avail].sort(() => Math.random() - 0.5);
  const list = Array.from({ length: count }, (_, i) => makeEnemy(shuffled[i % shuffled.length], floor));
  if (floor - lastRareSeen >= RARE_COOLDOWN && Math.random() < rareChance) {
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
const DEFAULT_META = { slots: 1, deaths: 0, bestFloor: 1, clears: 0, bonusHp: 0, inherited: [], checkpoint: 1, dewBank: 0, skills: {}, mossHeartStages: [] };

/* ------------------------------------------------------------
   スキルツリー定義 (宝樹の雫=精の結晶で解放する永続スキル)
------------------------------------------------------------ */
const SKILL_TREE = [
  // 戦闘拡張
  { id: "weaponSlot4", name: "武器IV", category: "戦闘拡張", cost: 4, requires: null,
    desc: "武器スロット 3→4。属性の幅が広がる。" },
  { id: "weaponSlot5", name: "武器V", category: "戦闘拡張", cost: 7, requires: "weaponSlot4",
    desc: "武器スロット 4→5。" },
  { id: "weaponSlot6", name: "武器VI", category: "戦闘拡張", cost: 12, requires: "weaponSlot5",
    desc: "武器スロット 5→6 (最大)。" },
  { id: "bladeMastery", name: "斬の極意", category: "戦闘拡張", cost: 5, requires: null,
    desc: "斬属性武器のダメージ+15%。" },
  { id: "magicMastery", name: "魔の極意", category: "戦闘拡張", cost: 5, requires: null,
    desc: "魔属性武器のダメージ+15%。" },
  // 探索
  { id: "bagCapI", name: "大きな鞄", category: "探索", cost: 3, requires: null,
    desc: "鞄の容量 14→19。" },
  { id: "bagCapII", name: "巨大な鞄", category: "探索", cost: 6, requires: "bagCapI",
    desc: "鞄の容量 19→24。" },
  { id: "goldSense", name: "精霊の気配", category: "探索", cost: 4, requires: null,
    desc: "金枝の精の出現率+4%。" },
  // 転生
  { id: "inheritSlot", name: "魂の脈絡", category: "転生", cost: 5, requires: null,
    desc: "継承枠が永続+1。" },
  { id: "startBonus", name: "旅装の記憶", category: "転生", cost: 3, requires: null,
    desc: "旅の始まりに生命の果実が1つ追加される。" },
];

async function loadMeta() {
  try {
    const r = await window.storage.get(SAVE_KEY);
    if (r && r.value) return { ...DEFAULT_META, ...JSON.parse(r.value) };
  } catch (e) { /* 初回は未保存 */ }
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
async function saveRun(floor, node, player, weapons, armor, inv, cds, lastRareSeen, orbBagBonus = 0, enemies = null) {
  try {
    const data = { floor, node: node || 0, player: { hp: player.hp, poison: player.poison || 0, atkUp: player.atkUp || 0, guard: false }, weapons, armor, inv, cds: cds || {}, lastRareSeen: lastRareSeen || 0, orbBagBonus: orbBagBonus || 0 };
    if (enemies && enemies.length > 0) data.enemies = enemies;
    await window.storage.set(RUN_SAVE_KEY, JSON.stringify(data));
  } catch {}
}
async function clearRun() {
  try { await window.storage.set(RUN_SAVE_KEY, ""); } catch {}
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
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { color: var(--paper); font-family: var(--font-body); }
.kw-root {
  height: 100dvh; width: 100%;
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
.kw-hand { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; flex-shrink: 0; }
.kw-wcard { position: relative; padding: 10px 12px; text-align: left; cursor: pointer; width: 100%;
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
  border-radius: 8px; padding: 10px 22px; font-size: 13px; white-space: nowrap; transition: all .18s ease; }
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
  background: rgba(6,10,8,.82); backdrop-filter: blur(4px); padding: 18px; animation: kwFade .4s ease; }
@keyframes kwFade { from { opacity: 0; } to { opacity: 1; } }
.kw-sheet { width: 100%; max-width: 660px; max-height: 88vh; overflow-y: auto; padding: 26px 26px 22px; }
.kw-sheet h2 { font-family: var(--font-display); font-weight: 800; font-size: 22px; letter-spacing: .18em; margin-bottom: 4px; }
.kw-sheet .kw-sub { color: var(--mist); font-size: 12px; margin-bottom: 16px; line-height: 1.8; }
.kw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 8px; }
.kw-cell { padding: 10px; cursor: pointer; text-align: left; position: relative; color: var(--paper);
  font-family: var(--font-body); width: 100%; transition: box-shadow .15s ease; }
.kw-cell .kw-cname { font-family: var(--font-display); font-size: 12.5px; font-weight: 700; margin: 4px 0 2px; line-height: 1.35; }
.kw-cell .kw-cmeta { font-size: 10.5px; color: var(--mist); line-height: 1.5; }
.kw-cell.picked { box-shadow: 0 0 0 1.5px var(--hotaru); }
.kw-cell.equipped-mark::after { content: "装備中"; position: absolute; top: 7px; right: 8px; font-size: 9px; color: var(--hotaru); letter-spacing: .1em; }
.kw-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; flex-wrap: wrap; }

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
  background: rgba(10,18,14,.75); z-index: 20; border-radius: inherit; }
.kw-bestiary-detail-card { background: var(--panel); border: 1px solid rgba(157,180,166,.2); border-radius: 10px;
  padding: 18px 20px; max-width: 260px; width: 88%; }
/* 図鑑 章カード */
.kw-bestiary-ch-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.kw-bestiary-ch-card { position: relative; overflow: hidden; height: 88px; border-radius: 8px;
  border: 1px solid rgba(157,180,166,.18); cursor: pointer; text-align: left; padding: 0;
  background: none; transition: border-color .15s; }
.kw-bestiary-ch-card:hover { border-color: rgba(157,180,166,.4); }
.kw-bestiary-ch-info { position: absolute; inset: 0; padding: 10px 12px; display: flex; flex-direction: column; justify-content: flex-end; }
/* スキルツリー */
.kw-sk-cat-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.kw-sk-cat-icon { width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
  background: rgba(94,130,101,.18); flex-shrink: 0; }
.kw-sk-cat-line { flex: 1; height: 1px; background: linear-gradient(to right, rgba(157,180,166,.25), transparent); }
.kw-sk-row { display: flex; align-items: stretch; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.kw-sk-card { position: relative; overflow: hidden; padding: 11px 13px 10px; border-radius: 10px;
  flex: 1; min-width: 110px; max-width: 200px;
  border: 1px solid rgba(157,180,166,.14); background: rgba(94,130,101,.04);
  transition: border-color .18s, background .18s, box-shadow .18s; }
.kw-sk-card.owned { border-color: rgba(232,180,74,.55);
  background: linear-gradient(145deg, rgba(232,180,74,.1), rgba(94,130,101,.07));
  box-shadow: 0 0 16px rgba(232,180,74,.16), inset 0 0 24px rgba(232,180,74,.04); }
.kw-sk-card.buyable { border-color: rgba(143,211,154,.5); background: rgba(94,130,101,.09); cursor: pointer; }
.kw-sk-card.buyable:hover { background: rgba(94,130,101,.17); box-shadow: 0 0 10px rgba(143,211,154,.18); }
.kw-sk-card.blocked { opacity: .28; }
.kw-sk-card-bg { position: absolute; right: -4px; bottom: -6px; pointer-events: none; }
.kw-sk-arrow { display: flex; align-items: center; padding: 0 2px; flex-shrink: 0;
  color: rgba(157,180,166,.3); font-size: 10px; }
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
  const moonClipPath = moonPhasePath(880, 150, 46, moonInfo.phase, moonInfo.waning);
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
        <circle cx="880" cy="150" r="150" fill={`url(#${moonGradId})`} />
        <circle cx="880" cy="150" r="46" fill={st.bg.moon} clipPath={moonClipPath ? `url(#${moonClipId})` : undefined} />
        <polygon points="820,150 940,150 1090,800 640,800" fill="rgba(235,226,196,0.045)" />
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
      {myFloats.map((f) => (
        <div key={f.key} className="kw-float" style={{ color: f.color, fontSize: f.size }}>{f.text}</div>
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

/* ------------------------------------------------------------
   メインゲーム
------------------------------------------------------------ */
const BASE_HP = 72;
const AFF_WEAK = 1.6, AFF_RES = 0.5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function starterState(meta, initialWeaponType = "dagger") {
  const inherited = (meta.inherited || []).map((it) => ({ ...it, id: uid() }));
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
  if (meta?.skills?.startBonus) inv.push(makeConsumable("berryBig"));
  return { weapons, armor, inv };
}

function floorNodes(floor) {
  if (floorInStage(floor) === 10) return ["boss"];
  const mid = Math.random() < 0.45 ? (Math.random() < 0.55 ? "chest" : "spring") : "battle";
  return ["battle", mid, "battle"];
}

/* ---- 設定オーバーレイ (タイトル・ラン両画面で共用) ---- */
function SettingsOverlay({ onClose, bgmVolume, seVolume, changeBgmVolume, changeSeVolume,
                           sleepDisabled, toggleSleep, cssClass }) {
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

        <div className="kw-actions" style={{ justifyContent: "center", marginTop: 24 }}>
          <button className="kw-btn primary" style={{ padding: "10px 30px" }} onClick={onClose}>閉じる</button>
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
  bladeMastery: Sword, magicMastery: Wand2,
  bagCapI: Package, bagCapII: Package,
  goldSense: Sparkles,
  inheritSlot: Heart, startBonus: Apple,
};
const CAT_ICON_MAP = { "戦闘拡張": Swords, "探索": Leaf, "転生": Moon };

function SkillTreeOverlay({ meta, onClose, onBuy }) {
  const skills = meta?.skills || {};
  const dewBank = meta?.dewBank || 0;
  const isOwned = (id) => !!skills[id];
  const canBuy = (sk) => !skills[sk.id] && dewBank >= sk.cost && (!sk.requires || !!skills[sk.requires]);

  const categories = [...new Set(SKILL_TREE.map((s) => s.category))];

  function buildRows(catSkills) {
    const childOf = {};
    catSkills.forEach((s) => { if (s.requires) childOf[s.requires] = [...(childOf[s.requires] || []), s]; });
    const roots = catSkills.filter((s) => !catSkills.find((cs) => cs.id === s.requires));
    const chains = roots.map((root) => {
      const chain = [root];
      let cur = root;
      while (childOf[cur.id]?.length) { cur = childOf[cur.id][0]; chain.push(cur); }
      return chain;
    });
    const singles = chains.filter((c) => c.length === 1).map((c) => c[0]);
    const multis = chains.filter((c) => c.length > 1);
    const rows = multis.map((c) => ({ type: "chain", skills: c }));
    if (singles.length) rows.push({ type: "group", skills: singles });
    return rows;
  }

  function SkillCard({ skill, inRow }) {
    const owned = isOwned(skill.id);
    const buyable = canBuy(skill);
    const blocked = !!(skill.requires && !isOwned(skill.requires));
    const BgIcon = SKILL_ICON_MAP[skill.id] || Gem;
    const cls = `kw-sk-card${owned ? " owned" : buyable ? " buyable" : blocked ? " blocked" : ""}`;
    return (
      <div className={cls} style={inRow ? { flex: 1 } : {}} onClick={() => buyable && onBuy(skill.id)}>
        {/* 背景アイコン */}
        <div className="kw-sk-card-bg">
          <BgIcon size={54} strokeWidth={0.7}
            color={owned ? "rgba(232,180,74,.13)" : "rgba(157,180,166,.07)"} />
        </div>
        {/* コスト/状態バッジ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{
            fontSize: 9, letterSpacing: ".12em", padding: "2px 6px", borderRadius: 3,
            background: owned ? "rgba(232,180,74,.18)" : buyable ? "rgba(143,211,154,.15)" : "rgba(157,180,166,.1)",
            color: owned ? "var(--hotaru)" : buyable ? "#8fd39a" : "var(--mist)",
          }}>
            {owned ? "✦ 習得済" : `${skill.cost} 結晶`}
          </span>
          {owned && <Sparkles size={10} color="var(--hotaru)" />}
        </div>
        {/* 名前 */}
        <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, letterSpacing: ".05em",
          color: owned ? "var(--hotaru)" : "var(--paper)", lineHeight: 1.2 }}>
          {skill.name}
        </div>
        {/* 説明 */}
        <div style={{ fontSize: 10, color: "var(--mist)", lineHeight: 1.6, marginTop: 5 }}>{skill.desc}</div>
        {blocked && (
          <div style={{ fontSize: 9, color: "var(--danger)", marginTop: 4, letterSpacing: ".05em" }}>
            要: {SKILL_TREE.find((s2) => s2.id === skill.requires)?.name}
          </div>
        )}
        {buyable && (
          <div style={{ marginTop: 6, fontSize: 9, color: "#8fd39a", letterSpacing: ".12em" }}>▶ タップで習得</div>
        )}
      </div>
    );
  }

  return (
    <div className="kw-overlay top" onClick={onClose}>
      <div className="kw-panel kw-sheet" style={{ maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}>

        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <h2 style={{ letterSpacing: ".2em" }}>スキルツリー</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20,
                background: "rgba(232,180,74,.1)", border: "1px solid rgba(232,180,74,.3)" }}>
                <Sparkles size={10} color="var(--hotaru)" />
                <span style={{ fontSize: 11, color: "var(--hotaru)", fontWeight: 700 }}>{dewBank}</span>
                <span style={{ fontSize: 10, color: "rgba(232,180,74,.7)" }}>精の結晶</span>
              </div>
            </div>
          </div>
          <button className="kw-btn ghost" style={{ padding: "6px 12px" }} onClick={onClose}><X size={14} /></button>
        </div>

        {/* カテゴリ別 */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {categories.map((cat) => {
            const CatIcon = CAT_ICON_MAP[cat] || Gem;
            const catSkills = SKILL_TREE.filter((s) => s.category === cat);
            const rows = buildRows(catSkills);
            return (
              <div key={cat} style={{ marginBottom: 22 }}>
                <div className="kw-sk-cat-head">
                  <div className="kw-sk-cat-icon">
                    <CatIcon size={14} color="var(--mist)" strokeWidth={1.5} />
                  </div>
                  <span style={{ fontSize: 10, letterSpacing: ".3em", color: "var(--mist)", whiteSpace: "nowrap" }}>{cat}</span>
                  <div className="kw-sk-cat-line" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rows.map((row, ri) => (
                    <div key={ri} className="kw-sk-row">
                      {row.type === "chain"
                        ? row.skills.map((skill, si) => (
                            <React.Fragment key={skill.id}>
                              <SkillCard skill={skill} inRow={false} />
                              {si < row.skills.length - 1 && (
                                <div className="kw-sk-arrow">
                                  <ChevronRight size={14} strokeWidth={1.5} />
                                </div>
                              )}
                            </React.Fragment>
                          ))
                        : row.skills.map((skill) => (
                            <SkillCard key={skill.id} skill={skill} inRow={true} />
                          ))
                      }
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ paddingTop: 10, display: "flex", justifyContent: "center" }}>
          <button className="kw-btn primary" style={{ padding: "10px 36px" }} onClick={onClose}>閉じる</button>
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
  const logRef = useRef(null);

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
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [confirmNewRun, setConfirmNewRun] = useState(null); // null or callback fn

  const [sleepDisabled, setSleepDisabled] = useState(() => {
    try { return localStorage.getItem("kw-sleep") !== "0"; } catch { return true; }
  });

  useEffect(() => { bgmVolRef.current = bgmVolume; }, [bgmVolume]);
  useEffect(() => { seVolRef.current  = seVolume;  }, [seVolume]);

  // 初回レンダリング完了を Swift に通知してスプラッシュ画面を消す + 起動時設定を復元
  useEffect(() => {
    try { window.webkit?.messageHandlers?.appReady?.postMessage({}); } catch {}
    try {
      const sl = localStorage.getItem("kw-sleep") !== "0";
      window.webkit?.messageHandlers?.settings?.postMessage({ sleep: sl });
    } catch {}
  }, []);

  const openURL = (url) => {
    try { window.webkit?.messageHandlers?.openURL?.postMessage({ url }); } catch {}
  };

  function toggleSleep() {
    const next = !sleepDisabled;
    setSleepDisabled(next);
    try { localStorage.setItem("kw-sleep", next ? "1" : "0"); } catch {}
    try { window.webkit?.messageHandlers?.settings?.postMessage({ sleep: next }); } catch {}
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

  // スリープ/バックグラウンド時に BGM を停止・復帰
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        sendBGM("pause");
        const fb = bgmFallbackRef.current; if (fb && !fb.paused) fb.pause();
      } else if (bgmStartedRef.current && bgmVolRef.current > 0) {
        sendBGM("play");
        const fb = bgmFallbackRef.current; if (fb && fb.paused) fb.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

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
    loadMeta().then(setMeta);
    loadRun().then((run) => { if (run && run.floor) setSavedRun(run); });
  }, []);

  const invCap = invCapOf(meta, g?.orbBagBonus || 0);

  async function buySkill(skillId) {
    if (!meta) return;
    const skill = SKILL_TREE.find((s) => s.id === skillId);
    if (!skill || (meta.dewBank || 0) < skill.cost) return;
    if (skill.requires && !meta.skills?.[skill.requires]) return;
    if (meta.skills?.[skillId]) return;
    const m2 = {
      ...meta,
      dewBank: meta.dewBank - skill.cost,
      skills: { ...meta.skills, [skillId]: true },
      ...(skillId === "inheritSlot" ? { slots: meta.slots + 1 } : {}),
    };
    setMeta(m2);
    await saveMeta(m2);
  }

  const armorDef = (st) => Object.values(st.armor).reduce((a, x) => a + (x ? x.def : 0), 0);
  const maxHpOf = (st, m = meta) => BASE_HP + (m?.bonusHp || 0) +
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
  function startFromChapter(chapterIdx) {
    let m = meta;
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
        setMeta(m); saveMeta(m);
      }
    }
    const eq = starterState(m, startWeapon);
    const startFloor = chapterIdx * 10 + 1;
    const base = {
      screen: "run", floor: startFloor, node: 0, nodes: floorNodes(startFloor), phase: "battle",
      player: { hp: 0, poison: 0, atkUp: 0, guard: false },
      ...eq, cds: {}, enemies: [], drops: [], logs: [], floats: [],
      pending: null, busy: false, bag: false, hitId: null, eventDone: false,
      confirm: null, full: false, lastRareSeen: 0, skillTree: false,
      orbBagBonus: 0, orbSlotBonus: 0, orbChoice: false,
      coach: chapterIdx === 0 && (m.checkpoint || 1) === 1,
      stageIntro: chapterIdx,
    };
    base.player.hp = maxHpOf(base, m);
    clearRun(); setSavedRun(null);
    const first = enterNode(base);
    saveRun(first.floor, first.node, first.player, first.weapons, first.armor, first.inv, first.cds, first.lastRareSeen, first.orbBagBonus, first.enemies);
    setG(first);
  }
  // チェックポイント(前回到達章)から続ける
  function startRun() { startFromChapter((meta.checkpoint || 1) - 1); }

  // タスクキル後の再開: 保存済みフロア状態を復元する
  function resumeRun(run) {
    const savedEnemies = (run.enemies || []).filter((e) => e.hp > 0);
    const base = {
      screen: "run", floor: run.floor, node: run.node || 0, nodes: floorNodes(run.floor), phase: "battle",
      player: run.player, weapons: run.weapons, armor: run.armor, inv: run.inv,
      cds: run.cds || {}, drops: [], logs: [], floats: [],
      pending: null, busy: false, bag: false, hitId: null, eventDone: false,
      confirm: null, full: false, lastRareSeen: run.lastRareSeen || 0, skillTree: false,
      orbBagBonus: run.orbBagBonus || 0, orbSlotBonus: run.orbSlotBonus || 0, orbChoice: false,
      coach: false, stageIntro: null,
    };
    setSavedRun(null);
    if (savedEnemies.length > 0) {
      const restored = { ...base, enemies: savedEnemies };
      saveRun(restored.floor, restored.node, restored.player, restored.weapons, restored.armor, restored.inv, restored.cds, restored.lastRareSeen, restored.orbBagBonus, restored.enemies);
      setG(restored);
    } else {
      const next = enterNode(base);
      saveRun(next.floor, next.node, next.player, next.weapons, next.armor, next.inv, next.cds, next.lastRareSeen, next.orbBagBonus, next.enemies);
      setG(next);
    }
  }

  function enterNode(st) {
    const kind = st.nodes[st.node];
    let s = { ...st, pending: null, drops: [], eventDone: false };
    if (kind === "battle" || kind === "boss") {
      // 武器スロットが全空なら袋から最強武器を自動装備。袋にもなければ応急の短剣を生成。
      if (!s.weapons.some(Boolean)) {
        const inBag = s.inv.filter((x) => x.kind === "weapon");
        if (inBag.length > 0) {
          const best = inBag.reduce((a, b) => (b.atk > a.atk ? b : a));
          s = { ...s, weapons: s.weapons.map((_, i) => (i === 0 ? best : null)), inv: s.inv.filter((x) => x.id !== best.id) };
          s = pushLog(s, `手に武器がない……${best.name}を袋から取り出した。`);
        } else {
          const fallback = makeWeapon(Math.max(1, s.floor - 2), { type: "dagger", rarity: "common" });
          s = { ...s, weapons: s.weapons.map((_, i) => (i === 0 ? fallback : null)) };
          s = pushLog(s, "折れかけた短剣が転がっていた。拾い上げて握りしめる……", true);
        }
      }
      s.phase = "battle";
      const lastRare = s.lastRareSeen || 0;
      const rareChance = meta ? rareChanceOf(meta) : 0.08;
      s.enemies = kind === "boss" ? [makeBoss(s.floor)] : enemiesForEncounter(s.floor, lastRare, rareChance);
      if (kind !== "boss" && s.enemies.some((e) => e.rare)) s = { ...s, lastRareSeen: s.floor };
      // 遭遇した敵を図鑑に記録
      { const ns = { ...(meta.seen || {}) }; let ch = false;
        for (const e of s.enemies) { if (e.bookId && !ns[e.bookId]) { ns[e.bookId] = true; ch = true; } }
        if (ch) { const m2 = { ...meta, seen: ns }; setMeta(m2); saveMeta(m2); } }
      s.cds = {};
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
    const masteryMult = (meta?.skills?.bladeMastery && t.dmgType === "斬") ? 1.15
      : (meta?.skills?.magicMastery && t.dmgType === "魔") ? 1.15 : 1;
    const raw = weapon.atk * atkMul * masteryMult;
    const target = enemies.find((e) => e.id === targetId && e.hp > 0) || enemies.find((e) => e.hp > 0);
    if (!target) return;
    const floats = [];
    const F = (eid, r) => {
      const label = r.tag === "weak" ? `弱点 ${r.dmg}` : r.tag === "res" ? `耐性 ${r.dmg}` : `${r.dmg}`;
      const color = r.tag === "weak" ? "var(--hotaru)" : r.tag === "res" ? "var(--paper-dim)" : "var(--paper)";
      floats.push({ key: uid(), targetId: eid, text: label, color, size: r.tag === "weak" ? 24 : 19, t: Date.now() });
    };

    if (weapon.type === "dagger") {
      for (let i = 0; i < 2; i++) {
        if (target.hp <= 0) break;
        const crit = Math.random() < 0.25;
        const r = hitEnemy(s, target, raw, t.dmgType, crit ? 1.8 : 1, discovered);
        if (crit) {
          floats.push({ key: uid(), targetId: target.id, text: `会心 ${r.dmg}`, color: "var(--hotaru)", size: 24, t: Date.now() });
        } else {
          F(target.id, r);
        }
      }
      s = pushLog(s, `${weapon.name}の二連撃。`);
    } else if (weapon.type === "greatsword") {
      const r = hitEnemy(s, target, raw, t.dmgType, 2.2, discovered); F(target.id, r);
      s = pushLog(s, `${weapon.name}を振り抜いた!`);
    } else if (weapon.type === "bow") {
      const r = hitEnemy(s, target, raw, t.dmgType, 1, discovered); F(target.id, r);
      const others = enemies.filter((e) => e.hp > 0 && e.id !== target.id);
      if (others.length) { const o = pick(others); const r2 = hitEnemy(s, o, raw, t.dmgType, 0.5, discovered); F(o.id, r2); }
      s = pushLog(s, `${weapon.name}で射抜き、流れ矢が走る。`);
    } else if (weapon.type === "axe") {
      const r = hitEnemy(s, target, raw, t.dmgType, 1.6, discovered); F(target.id, r);
      target.def = Math.max(0, target.def - 2);
      floats.push({ key: uid(), targetId: target.id, text: "防御破壊", color: "var(--mist)", size: 13, t: Date.now() });
      s = pushLog(s, `${weapon.name}が守りを砕く。`);
    } else if (weapon.type === "spear") {
      const idx = enemies.findIndex((e) => e.id === target.id);
      const r = hitEnemy(s, target, raw, t.dmgType, 1.1, discovered); F(target.id, r);
      const behind = enemies.slice(idx + 1).find((e) => e.hp > 0);
      if (behind) { const r2 = hitEnemy(s, behind, raw, t.dmgType, 0.7, discovered); F(behind.id, r2); }
      s = pushLog(s, `${weapon.name}の貫きが奥まで届く。`);
    } else if (weapon.type === "book") {
      for (const e of enemies) if (e.hp > 0) { const r = hitEnemy(s, e, raw, t.dmgType, 1.0, discovered); F(e.id, r); }
      s = pushLog(s, `${weapon.name}の一節が森を薙ぐ。`);
    } else if (weapon.type === "staff") {
      const r = hitEnemy(s, target, raw, t.dmgType, 1.4, discovered); F(target.id, r);
      const heal = Math.round(maxHpOf(s) * 0.1);
      s.player = { ...s.player, hp: Math.min(maxHpOf(s), s.player.hp + heal) };
      floats.push({ key: uid(), targetId: "player", text: `+${heal}`, color: "#8fd39a", size: 18, t: Date.now() });
      s = pushLog(s, `${weapon.name}の光が敵を打ち、身体を癒す。`);
    } else if (weapon.type === "instrument") {
      for (const e of enemies) if (e.hp > 0) {
        const r = hitEnemy(s, e, raw, t.dmgType, 1.0, discovered); F(e.id, r);
        e.atkDown = 2;
      }
      s = pushLog(s, `${weapon.name}の旋律が敵を怯ませる(攻撃弱体)。`);
    }

    if (t.cd > 0) s.cds = { ...s.cds, [weapon.id]: t.cd + 1 }; // このターン終了時に-1される
    s.enemies = enemies;
    s.floats = [...s.floats, ...floats];
    s.hitId = target.id;
    setG(s);
    // 発見情報を保存
    const m2 = { ...meta, discovered };
    setMeta(m2); saveMeta(m2);
    await sleep(650);
    await afterPlayerAction();
  }

  /* ---------- 道具を使う(戦闘中はターン消費) ---------- */
  async function useItem(item) {
    const st0 = gRef.current;
    const inBattle = st0.phase === "battle";
    if (inBattle && st0.busy) return;
    const c = CONSUMABLES[item.itemId];
    if (c.kind === "bomb" && !inBattle) return; // 森火の実は戦闘中のみ
    let s = { ...st0, bag: false, busy: inBattle };
    s.inv = s.inv.filter((x) => x.id !== item.id);
    const mx = maxHpOf(s);
    if (c.kind === "heal") {
      const heal = Math.round(mx * c.power);
      s.player = { ...s.player, hp: Math.min(mx, s.player.hp + heal) };
      s = addFloat(s, "player", `+${heal}`, "#8fd39a", 20);
      s = pushLog(s, `${c.label}を口にした。`);
    } else if (c.kind === "cure") {
      s.player = { ...s.player, poison: 0, hp: Math.min(mx, s.player.hp + Math.round(mx * c.power)) };
      s = pushLog(s, `${c.label}で毒が消えた。`);
    } else if (c.kind === "buff") {
      s.player = { ...s.player, atkUp: c.turns + (inBattle ? 1 : 0) };
      s = pushLog(s, `${c.label}が全身を巡る。攻撃+40%!`, true);
    } else if (c.kind === "bomb" && inBattle) {
      const power = 20 + s.floor * 2; // 深い階ほど強力
      const enemies = s.enemies.map((e) => ({ ...e }));
      for (const e of enemies) if (e.hp > 0) {
        e.hp = Math.max(0, e.hp - power);
        s = addFloat(s, e.id, `${power}`, "#f0946a", 22);
      }
      s.enemies = enemies;
      s = pushLog(s, `${c.label}が弾け、火の粉が敵を包む!`, true);
    } else if (c.kind === "metaHp") {
      const m2 = { ...meta, bonusHp: (meta.bonusHp || 0) + 6 };
      setMeta(m2); saveMeta(m2);
      s.player = { ...s.player, hp: s.player.hp + 6 };
      s = pushLog(s, `苔の心臓が鼓動する……最大HPが永続+6。`, true);
    } else if (c.kind === "orb") {
      s = { ...s, orbChoice: true, busy: false };
    } else {
      s.busy = false;
    }
    setG(s);
    if (inBattle && s.busy) { await sleep(600); await afterPlayerAction(); }
  }

  async function guard() {
    const st0 = gRef.current;
    if (st0.busy || st0.phase !== "battle") return;
    let s = { ...st0, busy: true, pending: null };
    s.player = { ...s.player, guard: true, hp: Math.min(maxHpOf(s), s.player.hp + Math.round(maxHpOf(s) * 0.05)) };
    s = pushLog(s, "身を低くして構えた(被ダメージ半減)。");
    setG(s);
    await sleep(450);
    await afterPlayerAction();
  }

  /* ---------- 行動後処理 → 敵ターン ---------- */
  async function afterPlayerAction() {
    let st = gRef.current;
    // 撃破判定
    const killed = st.enemies.filter((e) => e.hp <= 0 && !e.counted);
    if (killed.length) {
      let s = { ...st, enemies: st.enemies.map((e) => e.hp <= 0 ? { ...e, counted: true } : e) };
      for (const k of killed) {
        if (k.rare) s = pushLog(s, `${k.name}を捕まえた! まばゆい光が零れ落ちる。`, true);
        else if (k.boss) s = pushLog(s, `${k.name}は静かに膝を折り、森に還っていく……`, true);
        else s = pushLog(s, `${k.name}を倒した。`);
      }
      setG(s); st = s;
      await sleep(420);
    }
    const alive = st.enemies.filter((e) => e.hp > 0);
    if (alive.length === 0) return battleWon(killedAll(st));
    // 敵ターン
    await enemyPhase();
  }
  const killedAll = (st) => st.enemies;

  function rollDrops(enemies, floor, inv) {
    const drops = [];
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
      if (roll < 0.38) drops.push(makeConsumable());
      else if (roll < wMax) drops.push(makeWeapon(floor));
      else if (roll < wMax + 0.12) drops.push(makeArmor(floor));
    }
    if (drops.length === 0) drops.push(makeConsumable());
    return drops;
  }

  async function battleWon(enemies) {
    const st = gRef.current;
    const isBoss = enemies.some((e) => e.boss);
    const drops = rollDrops(enemies.filter((e) => e.hp <= 0 && !e.fled), st.floor, st.inv);
    let s = { ...st, busy: false, phase: "reward", drops };
    s.player = { ...s.player, guard: false };
    if (isBoss) {
      const stage = stageOf(st.floor) + 1; // 1..10
      const sIdx = stage - 1;
      // 苔の心臓がドロップした章をフラグ登録(以降その章では出なくなる)
      const mhStages = drops.some((d) => d.itemId === "mossHeart")
        ? [...(meta.mossHeartStages || []), sIdx]
        : (meta.mossHeartStages || []);
      if (stage >= 10) {
        // 百層踏破 — エンディング
        const keep = [...s.weapons.filter(Boolean), ...Object.values(s.armor).filter(Boolean), ...s.inv, ...drops];
        const m2 = { ...meta, mossHeartStages: mhStages, clears: meta.clears + 1, slots: meta.slots + 1, bestFloor: 100, inherited: keep };
        setMeta(m2); await saveMeta(m2);
        s.phase = "ending";
        // 初回全章踏破でレビューを促す
        if (meta.clears === 0) {
          try { window.webkit?.messageHandlers?.requestReview?.postMessage(null); } catch (_) {}
        }
      } else {
        // 章クリア: 継承枠+1、次章から再出発できるようになる
        const m2 = {
          ...meta, mossHeartStages: mhStages, slots: meta.slots + 1,
          bestFloor: Math.max(meta.bestFloor, st.floor),
          checkpoint: Math.max(meta.checkpoint || 1, stage + 1),
        };
        setMeta(m2); await saveMeta(m2);
        s.phase = "clear";
        // 第2・3章ボス初クリア時にレビューを促す
        if ((stage === 2 || stage === 3) && (meta.checkpoint || 1) <= stage) {
          try { window.webkit?.messageHandlers?.requestReview?.postMessage(null); } catch (_) {}
        }
      }
    }
    setG(s);
  }

  /* ---------- 敵の行動 ---------- */
  async function enemyPhase() {
    let s = { ...gRef.current };
    let enemies = s.enemies.map((e) => ({ ...e }));
    let player = { ...s.player };
    const mx = maxHpOf(s);
    const def = armorDef(s);

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
      player.hp = Math.max(0, player.hp - dmg);
      s = { ...s, floats: [...s.floats, { key: uid(), targetId: "player", text: `${dmg}`, color: "var(--danger)", size: 20, t: Date.now() }] };
      // 吸収(与ダメの半分を回復)
      if (e.drain && dmg > 0) {
        const rec = Math.round(dmg / 2);
        e.hp = Math.min(e.maxHp, e.hp + rec);
        s = { ...s, floats: [...s.floats, { key: uid(), targetId: e.id, text: `+${rec}`, color: "#8fd39a", size: 15, t: Date.now() }] };
      }
      // 毒攻撃
      if (e.poison && Math.random() < 0.4 && player.poison <= 0) {
        player.poison = 3;
        s = pushLog(s, `${e.name}の毒! 身体が痺れていく。`);
      }
      if (e.atkDown > 0) e.atkDown -= 1;
      setG({ ...s, enemies, player });
      await sleep(380);
      s = gRef.current; enemies = s.enemies.map((x) => ({ ...x })); player = { ...s.player };
    }

    // 毒・持続効果の処理
    if (player.hp > 0 && player.poison > 0) {
      const p = Math.max(2, Math.round(mx * 0.06));
      player.hp = Math.max(0, player.hp - p);
      player.poison -= 1;
      s = { ...s, floats: [...s.floats, { key: uid(), targetId: "player", text: `毒 ${p}`, color: "#a98ad9", size: 16, t: Date.now() }] };
    }
    if (player.atkUp > 0) player.atkUp -= 1;
    player.guard = false;
    // クールダウン減少
    const cds = {};
    for (const [k, v] of Object.entries(s.cds)) if (v - 1 > 0) cds[k] = v - 1;

    if (player.hp <= 0) {
      const m2 = { ...meta, deaths: meta.deaths + 1, bestFloor: Math.max(meta.bestFloor, s.floor) };
      setMeta(m2); saveMeta(m2);
      clearRun(); setSavedRun(null); // 死亡時は再開データを消去
      const stDead = { ...s, enemies, player, cds };
      const effSlots = meta.slots + (s.orbSlotBonus || 0);
      setG({ ...stDead, busy: false, phase: "dead", pick: recommendPick(stDead, effSlots), effSlots });
      return;
    }
    const finalState = { ...s, enemies, player, cds, busy: false };
    setG(finalState);
    saveRun(finalState.floor, finalState.node, finalState.player, finalState.weapons, finalState.armor, finalState.inv, finalState.cds, finalState.lastRareSeen, finalState.orbBagBonus, finalState.enemies);
  }

  /* ---------- 装備・袋 ---------- */
  function equipItem(item) {
    setG((s) => {
      let ns = { ...s };
      if (item.kind === "weapon") {
        let idx = ns.weapons.findIndex((w) => !w);
        if (idx < 0) {
          // 空きがなければ最も攻撃力の低い武器と入れ替える
          idx = ns.weapons.reduce((mi, w, i) => (w.atk < ns.weapons[mi].atk ? i : mi), 0);
        }
        const old = ns.weapons[idx];
        ns.weapons = ns.weapons.map((w, i) => (i === idx ? item : w));
        ns.inv = ns.inv.filter((x) => x.id !== item.id);
        if (old) ns.inv = [...ns.inv, old];
        ns = pushLog(ns, old ? `${old.name}を仕舞い、${item.name}を構えた。` : `${item.name}を構えた。`);
      } else if (item.kind === "armor") {
        const old = ns.armor[item.slot];
        ns.armor = { ...ns.armor, [item.slot]: item };
        ns.inv = ns.inv.filter((x) => x.id !== item.id);
        if (old) ns.inv = [...ns.inv, old];
        const mx = maxHpOf(ns);
        ns.player = { ...ns.player, hp: Math.min(mx, ns.player.hp + (item.hp || 0)) };
        ns = pushLog(ns, `${item.name}を身につけた。`);
      }
      return ns;
    });
  }
  function unequipWeapon(idx) {
    setG((s) => {
      const w = s.weapons[idx];
      if (!w || s.inv.length >= invCap) return s;
      return { ...s, weapons: s.weapons.map((x, i) => (i === idx ? null : x)), inv: [...s.inv, w] };
    });
  }
  function discardItem(item) {
    setG((s) => ({ ...s, inv: s.inv.filter((x) => x.id !== item.id) }));
  }

  // ドロップ1点を回収する純関数(拾えなければ full: true を添える)
  function takeDropPure(s, item) {
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
  const takeDrop = (item) => setG((s) => takeDropPure(s, item));
  // ドロップ全回収の純関数
  function takeAllPure(s) {
    let ns = { ...s, full: false };
    // 装備品を先に(空きスロットへ自動装備されるため)
    const ordered = [...ns.drops].sort((a, b) => (a.kind === "item" ? 1 : 0) - (b.kind === "item" ? 1 : 0));
    for (const d of ordered) ns = takeDropPure(ns, d);
    return ns;
  }
  const takeAllDrops = () => setG((s) => takeAllPure(s));
  // 確認画面用: 全部拾えたらそのまま進む
  const takeAllAndGo = () => setG((s) => {
    const ns = takeAllPure(s);
    if (ns.drops.length === 0) return nextNode({ ...ns, confirm: null });
    return ns;
  });

  // 先へ進む: 未回収の戦利品 / 未開封のイベントがあれば確認を挟む
  function tryProceed() {
    setG((s) => {
      if (s.drops.length > 0) return { ...s, confirm: "drops", full: false };
      if ((s.phase === "chest" || s.phase === "spring") && !s.eventDone) return { ...s, confirm: "event", full: false };
      return nextNode({ ...s, confirm: null, full: false });
    });
  }
  const proceedLeaving = () => setG((s) => nextNode({ ...s, drops: [], confirm: null, full: false }));

  // 装備との比較ヒント
  function hintFor(item, st = g) {
    if (item.kind === "weapon") {
      const eq = st.weapons.filter(Boolean);
      if (eq.length === 0) return { text: "すぐ装備できます", up: true };
      const worst = Math.min(...eq.map((w) => w.atk));
      const best = Math.max(...eq.map((w) => w.atk));
      if (item.atk > best) return { text: `↑ 手持ちで最強(攻 +${item.atk - best})`, up: true };
      if (item.atk > worst) return { text: `↑ 最弱の武器より 攻 +${item.atk - worst}`, up: true };
      return { text: `↓ 手持ちの方が強い(攻 ${item.atk - worst})`, down: true };
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
      if (Math.random() < 0.35) { ns.drops = [makeConsumable()]; return pushLog(ns, "泉の底に何かが沈んでいた。", true); }
      return pushLog(ns, "泉の水が傷と毒を洗い流した。");
    });
  }

  /* ---------- 死と継承 ---------- */
  // 価値の高い順に自動選択(永続アイテム > 高レア装備 > 消耗品)
  function itemScore(it) {
    const ri = RARITIES.findIndex((r) => r.id === it.rarity);
    if (it.kind === "item") {
      const c = CONSUMABLES[it.itemId];
      if (c.kind === "meta" || c.kind === "metaHp") return 10000; // 雫・心臓は最優先
      return 10 + ri;
    }
    if (it.kind === "weapon") return ri * 100 + it.atk;
    return ri * 100 + it.def * 3 + it.hp;
  }
  function allOwned(s) {
    return [...s.weapons.filter(Boolean), ...Object.values(s.armor).filter(Boolean), ...s.inv];
  }
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
  async function rebirth() {
    const s = gRef.current;
    const all = [...s.weapons.filter(Boolean), ...Object.values(s.armor).filter(Boolean), ...s.inv];
    let inherited = all.filter((x) => s.pick.includes(x.id));
    // 剣(武器)は必ず1本引き継ぐ: 選んでいなければ最も強い武器を継承枠とは別に持たせる
    if (!inherited.some((x) => x.kind === "weapon")) {
      const weapons = all.filter((x) => x.kind === "weapon");
      if (weapons.length) inherited = [...inherited, weapons.reduce((a, b) => (b.atk > a.atk ? b : a))];
    }
    const m2 = { ...meta, inherited };
    setMeta(m2); await saveMeta(m2);
    // 新しい旅へ(到達済みの章の頭から)
    const eq = starterState(m2);
    const startFloor = (Math.min(m2.checkpoint || 1, 10) - 1) * 10 + 1;
    const base = {
      screen: "run", floor: startFloor, node: 0, nodes: floorNodes(startFloor), phase: "battle",
      player: { hp: 0, poison: 0, atkUp: 0, guard: false },
      ...eq, cds: {}, enemies: [], drops: [], logs: [{ text: "……灯りに導かれ、魂は再び旅の途中へ還る。", strong: true, k: uid() }], floats: [],
      pending: null, busy: false, bag: false, hitId: null, eventDone: false,
      confirm: null, full: false, lastRareSeen: 0, skillTree: false, stageIntro: stageOf(startFloor),
    };
    base.player.hp = maxHpOf(base, m2);
    setG(enterNode(base));
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
          {(!meta.inherited || meta.inherited.filter((x) => x.kind === "weapon").length === 0) && (
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
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", justifyContent: "center" }}>
              <button className="kw-btn" style={{ padding: "10px 28px", fontSize: 13, borderColor: "var(--hotaru)", color: "var(--hotaru)" }}
                onClick={() => resumeRun(savedRun)}>
                冒険を再開（{floorLabel(savedRun.floor)}層）
              </button>
              <button className="kw-btn ghost" style={{ padding: "10px 16px", fontSize: 12, color: "var(--danger)", borderColor: "rgba(220,80,80,.35)" }}
                onClick={() => setConfirmAbandon(true)}>
                放棄する
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="kw-btn primary" style={{ padding: "13px 36px", fontSize: 15 }}
              onClick={() => savedRun ? setConfirmNewRun(() => startRun) : startRun()}>
              {meta.checkpoint > 1 ? `第${Math.min(meta.checkpoint, 10)}章 から 続 け る` : "森 へ 入 る"}
            </button>
            {meta.checkpoint > 1 && (
              <button className="kw-btn ghost" style={{ padding: "13px 22px", fontSize: 13 }}
                onClick={() => setG((s) => ({ ...s, chapterSelect: true }))}>章 を 選 ぶ</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
            <button className="kw-btn ghost" style={{ padding: "8px 22px", fontSize: 12 }}
              onClick={() => setG((s) => ({ ...s, howToPlay: true }))}>遊 び 方</button>
            <button className="kw-btn ghost" style={{ padding: "8px 22px", fontSize: 12 }}
              onClick={() => setG((s) => ({ ...s, skillTree: true }))}>
              スキルツリー{(meta.dewBank || 0) > 0 ? ` ✦${meta.dewBank}` : ""}
            </button>
            <button className="kw-btn ghost" style={{ padding: "8px 22px", fontSize: 12 }}
              onClick={() => setG((s) => ({ ...s, bestiary: true }))}>図 鑑</button>
          </div>
          <div className="kw-tmeta" style={{ marginTop: 10, fontSize: 11.5 }}>
            転生 {meta.deaths} 回 ／ 最深 {floorLabel(meta.bestFloor)} ／ 継承枠 {meta.slots}
            {meta.inherited?.length > 0 && <> ／ 継承品 {meta.inherited.length} 点</>}
            {meta.clears > 0 && <> ／ 百層踏破 {meta.clears} 回</>}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
            <button className="kw-btn ghost" style={{ fontSize: 11, padding: "6px 16px", opacity: .65 }}
              onClick={() => { try { window.webkit?.messageHandlers?.requestReview?.postMessage(null); } catch (_) {} }}>
              ★ レビューする
            </button>
            <button className="kw-btn ghost" style={{ fontSize: 11, padding: "6px 16px", opacity: .65 }}
              onClick={() => openURL("https://apps.apple.com/gm/developer/eiki-ogawa/id1701253076")}>
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
              <div className="kw-sub">ボスを倒した章の頭から再挑戦できます。継承品はそのまま持ち込まれます。</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 12 }}>
                {STAGES.map((st, i) => {
                  const ch = i + 1;
                  if (ch > meta.checkpoint) return null;
                  const cleared = ch < meta.checkpoint;
                  const current = ch === meta.checkpoint;
                  return (
                    <button key={i}
                      style={{
                        position: "relative", overflow: "hidden", height: 90,
                        borderRadius: 8, border: current ? "1.5px solid var(--hotaru)" : "1px solid rgba(157,180,166,.18)",
                        textAlign: "left", cursor: "pointer", padding: 0,
                      }}
                      onClick={() => {
                        if (savedRun) {
                          setConfirmNewRun(() => () => { setG((s) => ({ ...s, chapterSelect: false })); startFromChapter(i); });
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
                        <div style={{ fontSize: 9.5, marginTop: 3, color: cleared ? "#8fd39a" : "var(--hotaru)" }}>
                          {cleared ? "✓ クリア済み" : "▶ 現在の到達地点"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="kw-divider" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <button className="kw-btn ghost" style={{ fontSize: 11, color: "var(--mist)", padding: "6px 14px" }}
                  onClick={() => setG((s) => ({ ...s, chapterSelect: false, confirmReset: true }))}>
                  第1章から継承品なしでやり直す
                </button>
                <button className="kw-btn ghost" onClick={() => setG((s) => ({ ...s, chapterSelect: false }))}>閉じる</button>
              </div>
            </div>
          </div>
        )}
        {confirmAbandon && (
          <div className="kw-overlay top" onClick={() => setConfirmAbandon(false)}>
            <div className="kw-panel kw-sheet" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ color: "var(--danger)" }}>冒険を放棄しますか?</h2>
              <div className="kw-sub">
                中断セーブを削除します。<br />
                所持していたアイテムや進行状況はすべて失われます。<br />
                転生回数・継承品・スキルなどのメタ記録は保たれます。
              </div>
              <div className="kw-actions">
                <button className="kw-btn ghost" style={{ marginRight: "auto" }}
                  onClick={() => setConfirmAbandon(false)}>← キャンセル</button>
                <button className="kw-btn" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                  onClick={() => { clearRun(); setSavedRun(null); setConfirmAbandon(false); }}>
                  放棄する
                </button>
              </div>
            </div>
          </div>
        )}
        {confirmNewRun && (
          <div className="kw-overlay top" onClick={() => setConfirmNewRun(null)}>
            <div className="kw-panel kw-sheet" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
              <h2>中断データがあります</h2>
              <div className="kw-sub">
                新しく始めると、中断中の冒険データは失われます。<br />
                転生回数・継承品・スキルなどのメタ記録は保たれます。
              </div>
              <div className="kw-actions">
                <button className="kw-btn ghost" style={{ marginRight: "auto" }}
                  onClick={() => setConfirmNewRun(null)}>← キャンセル</button>
                <button className="kw-btn primary"
                  onClick={() => { clearRun(); setSavedRun(null); confirmNewRun(); setConfirmNewRun(null); }}>
                  新しく始める
                </button>
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
                  onClick={async () => {
                    const m2 = { ...meta, checkpoint: 1, inherited: [] };
                    setMeta(m2); await saveMeta(m2);
                    setG({ screen: "title" });
                  }}>始めからやり直す</button>
              </div>
            </div>
          </div>
        )}
        {g.howToPlay && (
          <div className="kw-overlay" onClick={() => setG((s) => ({ ...s, howToPlay: false }))}>
            <div className="kw-panel kw-sheet" style={{ maxWidth: 520, textAlign: "left" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ letterSpacing: ".2em" }}>遊び方</h2>
              <div className="kw-sub" style={{ fontSize: 13, lineHeight: 2, marginTop: 8 }}>
                <b style={{ color: "var(--paper)" }}>武器カード</b>をタップして攻撃します。敵が複数いるときは武器を選んだ後に狙う敵を選びます。<br /><br />
                ダメージに「<b style={{ color: "var(--hotaru)" }}>弱点</b>」と出たらその属性が有効です。敵カードに弱点が記録され、次からの目印になります。<br /><br />
                <b style={{ color: "var(--paper)" }}>防御</b>ボタンで構えると次の敵の攻撃ダメージが半減します。HPが低い時に使いましょう。<br /><br />
                <b style={{ color: "var(--paper)" }}>袋</b>ボタンから消耗品の使用・装備の変更ができます。袋が満杯の場合は不要品を「捨てる」で手放せます。<br /><br />
                倒れても選んだ装備は次の旅へ受け継がれます。章のボスを倒すと、死んでもその章から再開できるようになります。
              </div>
              <div className="kw-actions" style={{ justifyContent: "center" }}>
                <button className="kw-btn primary" style={{ padding: "10px 30px" }}
                  onClick={() => setG((s) => ({ ...s, howToPlay: false }))}>閉じる</button>
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
            cssClass=""
          />
        )}
        {g.skillTree && (
          <SkillTreeOverlay meta={meta} onClose={() => setG((s) => ({ ...s, skillTree: false }))} onBuy={buySkill} />
        )}
        {g.bestiary && (
          <BestiaryOverlay meta={meta} onClose={() => setG((s) => ({ ...s, bestiary: false }))} />
        )}
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
              <div className="kw-panel" style={{ padding: "30px 34px", textAlign: "center", maxWidth: 420, width: "100%" }}>
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
                <div style={{ marginTop: 14 }}>
                  <button className="kw-btn ghost" onClick={tryProceed}>先へ進む →</button>
                </div>
              </div>
            </div>
          )}

          {g.phase === "spring" && (
            <div className="kw-field-panel">
              <div className="kw-panel" style={{ padding: "30px 34px", textAlign: "center", maxWidth: 420, width: "100%", position: "relative" }}>
                {floatsFor("player").map((f) => (
                  <div key={f.key} className="kw-float" style={{ color: f.color, fontSize: f.size }}>{f.text}</div>
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
                <div style={{ marginTop: 14 }}>
                  <button className="kw-btn ghost" onClick={tryProceed}>先へ進む →</button>
                </div>
              </div>
            </div>
          )}

          {g.phase === "reward" && (
            <div className="kw-field-panel">
              <div className="kw-panel" style={{ padding: "26px 30px", textAlign: "center", maxWidth: 560, width: "100%" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: ".2em", color: "var(--hotaru)" }}>勝 利</div>
                <div style={{ fontSize: 12, color: "var(--mist)", margin: "8px 0 14px" }}>
                  {g.drops.length > 0 ? <>森が戦利品を落としていった。<span style={{ marginLeft: 8, color: "var(--paper-dim)" }}>袋 {g.inv.length}/{invCap}</span></> : "今回は何も落ちていないようだ。"}
                </div>
                {g.drops.length > 0 && (
                  <div className="kw-grid">
                    {g.drops.map((d) => <ItemCell key={d.id} item={d} onClick={() => takeDrop(d)} actionLabel="拾う / 装備" hint={hintFor(d)} />)}
                  </div>
                )}
                {g.full && <div className="kw-notice">袋がいっぱいで拾えませんでした。「袋」から不要な物を捨てるか、置いて進みましょう。</div>}
                <div className="kw-actions" style={{ justifyContent: "center" }}>
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
          {floatsFor("player").filter(() => g.phase === "battle").map((f) => (
            <div key={f.key} className="kw-float" style={{ color: f.color, fontSize: f.size, top: -28 }}>{f.text}</div>
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
              <button className="kw-btn ghost" disabled={g.busy} onClick={guard}>防御<span style={{ fontSize: 9, color: "var(--mist)", marginLeft: 3 }}>被ダメ半減</span></button>
              <button className="kw-btn ghost" disabled={g.busy} onClick={() => setG((s) => ({ ...s, bag: true }))}
                style={g.inv.length >= invCap ? { borderColor: "var(--danger)", color: "var(--danger)" } : undefined}>
                袋 ({g.inv.length}/{invCap}){g.inv.length >= invCap ? " 満杯" : ""}
              </button>
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

        {/* ログ */}
        <div className="kw-panel kw-log" ref={logRef}>
          {g.logs.map((l, i, arr) => (
            <div key={l.k} className={i === arr.length - 1 ? "new" : ""}>
              {l.strong ? <b>{l.text}</b> : l.text}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- 袋オーバーレイ ---------- */}
      {g.bag && (
        <div className="kw-overlay" onClick={() => setG((s) => ({ ...s, bag: false }))}>
          <div className="kw-panel kw-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2>旅の袋</h2>
                <div className="kw-sub">
                  {g.phase === "battle"
                    ? "戦闘中は消耗品のみ使えます(1ターン消費)。"
                    : "消耗品を使う・武具を装備する・不要品は「捨てる」ボタンで手放せます。"}
                </div>
              </div>
              <button className="kw-btn ghost" style={{ padding: "6px 12px" }} onClick={() => setG((s) => ({ ...s, bag: false }))}><X size={14} /></button>
            </div>

            {g.phase !== "battle" && (
              <>
                <div style={{ fontSize: 11, color: "var(--mist)", letterSpacing: ".15em", margin: "4px 0 8px" }}>── 装備中の武器(タップで外す)</div>
                <div className="kw-grid">
                  {g.weapons.map((w, i) => w
                    ? <ItemCell key={w.id} item={w} equipped onClick={() => unequipWeapon(i)} />
                    : <div key={i} className="kw-panel kw-cell" style={{ opacity: .3, cursor: "default" }}><div className="kw-cmeta">空きスロット</div></div>)}
                </div>
                <div style={{ fontSize: 11, color: "var(--mist)", letterSpacing: ".15em", margin: "12px 0 8px" }}>── 防具</div>
                <div className="kw-grid">
                  {Object.entries(ARMOR_TYPES).map(([slot, a]) => g.armor[slot]
                    ? <ItemCell key={slot} item={g.armor[slot]} equipped onClick={() => {}} />
                    : <div key={slot} className="kw-panel kw-cell" style={{ opacity: .3, cursor: "default" }}><div className="kw-cmeta">{a.label}: なし</div></div>)}
                </div>
                <div className="kw-divider" />
              </>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 8px" }}>
              <div style={{ fontSize: 11, color: "var(--mist)", letterSpacing: ".15em" }}>── 袋の中身 ({g.inv.length}/{invCap})</div>
              {(meta.dewBank || 0) > 0 && (
                <button className="kw-btn ghost" style={{ padding: "3px 10px", fontSize: 10 }}
                  onClick={() => setG((s) => ({ ...s, skillTree: true }))}>
                  <Sparkles size={10} style={{ display: "inline", marginRight: 3 }} />スキルツリー {meta.dewBank}個
                </button>
              )}
            </div>
            {g.inv.length === 0 && <div className="kw-sub">袋は空です。森で拾い集めましょう。</div>}
            <div className="kw-grid">
              {g.inv.map((it) => {
                const inBattle = g.phase === "battle";
                if (it.kind === "item") {
                  return <ItemCell key={it.id} item={it} actionLabel="使う" onClick={() => useItem(it)} />;
                }
                if (inBattle) return <ItemCell key={it.id} item={it} onClick={() => {}} />;
                return (
                  <div key={it.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <ItemCell item={it} actionLabel="装備する" onClick={() => equipItem(it)} hint={hintFor(it)} />
                    <button className="kw-btn ghost" style={{ padding: "5px 0", fontSize: 11, width: "100%", letterSpacing: ".12em" }}
                      onClick={(e) => { e.stopPropagation(); discardItem(it); }}>捨てる</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------- 死 → 魂の継承 ---------- */}
      {g.phase === "dead" && (
        <div className="kw-overlay">
          <div className="kw-panel kw-sheet">
            <h2 style={{ color: "var(--danger)" }}>旅人は倒れた</h2>
            <div className="kw-sub">
              しかし魂は森を巡り、また灯りの下へ還る。<br />
              再開地点: <b style={{ color: "var(--hotaru)" }}>第{Math.min(meta.checkpoint || 1, 10)}章のはじめ</b>(章の主を倒すたび先の章から再開できます)<br />
              <b style={{ color: "var(--hotaru)" }}>継承枠 {g.effSlots ?? meta.slots} つ</b>まで、次の生へ持ち越す品を選べます。{(g.effSlots ?? meta.slots) > meta.slots ? <span style={{ color: "var(--hotaru)", fontSize: 10 }}>（宝珠+{(g.effSlots ?? meta.slots) - meta.slots}）</span> : ""}<br />
              精の結晶: <b style={{ color: "var(--hotaru)" }}>{meta.dewBank || 0}</b> 個 — スキルツリーで永続スキルを習得できます。
            </div>
            <div className="kw-grid">
              {allOwned(g).map((it) => (
                <ItemCell key={it.id} item={it} picked={g.pick.includes(it.id)} onClick={() => togglePick(it)}
                  actionLabel={g.pick.includes(it.id) ? "✓ 持っていく" : "タップで選ぶ"} />
              ))}
            </div>
            {/* 武器を選んでいない場合の自動継承注記 */}
            {allOwned(g).some((x) => x.kind === "weapon") &&
              !g.pick.some((id) => allOwned(g).find((x) => x.id === id)?.kind === "weapon") && (
              <div className="kw-notice" style={{ borderColor: "rgba(255,255,255,.12)", color: "var(--mist)" }}>
                武器を選んでいません。転生すると最も強い武器が自動で引き継がれます。
              </div>
            )}
            <div className="kw-actions">
              <div style={{ alignSelf: "center", fontSize: 12, color: g.pick.length >= (g.effSlots ?? meta.slots) ? "var(--hotaru)" : "var(--mist)", marginRight: "auto" }}>
                選択 {g.pick.length} / {g.effSlots ?? meta.slots}
              </div>
              {(meta.dewBank || 0) > 0 && (
                <button className="kw-btn ghost" onClick={() => setG((s) => ({ ...s, skillTree: true }))}>
                  <Sparkles size={11} style={{ display: "inline", marginRight: 4 }} />スキルツリー ({meta.dewBank}個)
                </button>
              )}
              <button className="kw-btn ghost" onClick={() => setG((s) => ({ ...s, pick: recommendPick(s, s.effSlots ?? meta.slots) }))}>おすすめ</button>
              <button className="kw-btn ghost" onClick={() => setG((s) => ({ ...s, pick: [] }))}>全て外す</button>
              <button className="kw-btn primary" onClick={rebirth}>
                {g.pick.length > 0 ? `${g.pick.length}点と共に、生まれ変わる` : "何も持たずに、生まれ変わる"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- 章クリア(旅は続く) ---------- */}
      {g.phase === "clear" && (
        <div className="kw-overlay">
          <div className="kw-panel kw-sheet" style={{ textAlign: "center" }}>
            <div style={{ margin: "6px 0 4px" }}><Star size={30} color="var(--hotaru)" strokeWidth={1.4} /></div>
            <h2 style={{ letterSpacing: ".3em" }}>第{stageOf(g.floor) + 1}章 了</h2>
            <div className="kw-sub" style={{ marginTop: 10 }}>
              {STAGES[stageOf(g.floor)].boss.name}は道を譲った。<br />
              霧の向こうに、第{stageOf(g.floor) + 2}章「{STAGES[Math.min(9, stageOf(g.floor) + 1)].name}」への降り口が見えている。<br /><br />
              <b style={{ color: "var(--hotaru)" }}>報酬:</b> 継承枠 +1 ／ 以後、死んでもこの先の章から再開できる ／ 主の戦利品
            </div>
            <div className="kw-grid" style={{ textAlign: "left" }}>
              {g.drops.map((d) => <ItemCell key={d.id} item={d} onClick={() => takeDrop(d)} actionLabel="拾う / 装備" hint={hintFor(d)} />)}
            </div>
            <div className="kw-actions" style={{ justifyContent: "center" }}>
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
            {g.full && <div className="kw-notice">袋がいっぱいで拾えませんでした。一度戻って「袋」から整理するか、置いていきましょう。</div>}
            <div className="kw-actions">
              <button className="kw-btn ghost" style={{ marginRight: "auto" }} onClick={() => setG((s) => ({ ...s, confirm: null }))}>← 戻る</button>
              <button className="kw-btn ghost" onClick={takeAllAndGo}>全部拾って進む</button>
              <button className="kw-btn primary" onClick={proceedLeaving}>置いて先へ進む →</button>
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
              <button className="kw-btn primary" onClick={async () => {
                const m2 = { ...meta, checkpoint: 1 };
                setMeta(m2); await saveMeta(m2);
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
              onClick={() => setG((s) => ({ ...s, stageIntro: null }))}>
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
                const rd = { floor: g.floor, node: g.node || 0, player: g.player, weapons: g.weapons, armor: g.armor, inv: g.inv, cds: g.cds || {}, lastRareSeen: g.lastRareSeen || 0, orbBagBonus: g.orbBagBonus || 0, enemies: aliveEnemies };
                saveRun(g.floor, g.node || 0, g.player, g.weapons, g.armor, g.inv, g.cds, g.lastRareSeen, g.orbBagBonus || 0, aliveEnemies);
                setSavedRun(rd);
                setG({ screen: "title" });
              }}>中断してタイトルへ</button>
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
          cssClass="top"
        />
      )}
      {g.skillTree && (
        <SkillTreeOverlay meta={meta} onClose={() => setG((s) => ({ ...s, skillTree: false }))} onBuy={buySkill} />
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
                onClick={() => {
                  const m2 = { ...meta, slots: (meta.slots || 0) + 1 };
                  setMeta(m2); saveMeta(m2);
                  setG((s) => ({ ...s, orbChoice: false,
                    logs: [...(s.logs || []), { id: uid(), text: `宝樹の雫が輝く……継承枠が永続+1された。(${m2.slots}枠)`, hi: true }] }));
                }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--paper)" }}>継承枠 +1</div>
                <div style={{ fontSize: 10, color: "var(--mist)", marginTop: 3 }}>転生時に引き継げるアイテム数が増える。現在 {meta.slots || 0} 枠。</div>
              </button>
              <button className="kw-btn ghost" style={{ textAlign: "left", padding: "12px 14px" }}
                onClick={() => {
                  const m2 = { ...meta, dewBank: (meta.dewBank || 0) + 1 };
                  setMeta(m2); saveMeta(m2);
                  setG((s) => ({ ...s, orbChoice: false,
                    logs: [...(s.logs || []), { id: uid(), text: `宝樹の雫が砕け、精の結晶に変わった。(${m2.dewBank}個)`, hi: true }] }));
                }}>
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
