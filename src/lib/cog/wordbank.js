// Analogy pairs graded by tier: 1 ~ age 8, 2 ~ age 10, 3 ~ age 12+. Tier is
// about vocabulary AND how abstract the relation is, so a tier-3 "opposite" is
// harder than a tier-1 one even though the relation is the same.
//
// Deliberate design: some words appear under MORE THAN ONE relation (glass is a
// material and a container; hot is a degree and an opposite). Those overlaps are
// what let the generator build the strongest kind of distractor -- a word that
// really is associated with the stem, just through the wrong relation. That is
// the exact trap a real CogAT item sets, and the exact trap a bright kid who
// answers on association rather than relation falls into.

export const RELATIONS = {
  category:      { label: 'is a kind of',      minTier: 1 },
  part_whole:    { label: 'is part of',        minTier: 1 },
  opposite:      { label: 'is the opposite of', minTier: 1 },
  function:      { label: 'is used to',        minTier: 1 },
  worker_tool:   { label: 'works with',        minTier: 2 },
  member_group:  { label: 'belongs to a group called', minTier: 2 },
  made_of:       { label: 'is made of',        minTier: 2 },
  degree:        { label: 'is a stronger form of', minTier: 2 },
  cause_effect:  { label: 'leads to',          minTier: 3 },
  lacks:         { label: 'has none of',       minTier: 3 },
}

// [a, b, tier]
export const PAIRS = {
  category: [
    ['dog', 'animal', 1], ['rose', 'flower', 1], ['oak', 'tree', 1], ['hammer', 'tool', 1],
    ['blue', 'color', 1], ['apple', 'fruit', 1], ['shirt', 'clothing', 1], ['robin', 'bird', 1],
    ['trumpet', 'instrument', 2], ['triangle', 'shape', 1], ['copper', 'metal', 2], ['spider', 'insect', 2],
    ['novel', 'book', 2], ['sonnet', 'poem', 3], ['oxygen', 'gas', 3], ['granite', 'rock', 3],
    ['maple', 'tree', 2], ['salmon', 'fish', 2],
  ],
  part_whole: [
    ['page', 'book', 1], ['petal', 'flower', 1], ['wheel', 'car', 1], ['branch', 'tree', 1],
    ['finger', 'hand', 1], ['room', 'house', 1], ['key', 'keyboard', 2], ['string', 'guitar', 2],
    ['island', 'archipelago', 3], ['verse', 'song', 2], ['scene', 'play', 2], ['chapter', 'novel', 2],
    ['engine', 'airplane', 2], ['root', 'plant', 1], ['crust', 'earth', 3], ['clause', 'sentence', 3],
  ],
  opposite: [
    ['hot', 'cold', 1], ['up', 'down', 1], ['open', 'closed', 1], ['day', 'night', 1],
    ['fast', 'slow', 1], ['heavy', 'light', 1], ['begin', 'end', 1], ['ancient', 'modern', 2],
    ['expand', 'shrink', 2], ['generous', 'stingy', 3], ['permanent', 'temporary', 3], ['praise', 'criticize', 3],
    ['arrive', 'depart', 2], ['gather', 'scatter', 2], ['reveal', 'conceal', 3], ['solid', 'liquid', 2],
  ],
  function: [
    ['broom', 'sweep', 1], ['pencil', 'write', 1], ['scissors', 'cut', 1], ['ladder', 'climb', 1],
    ['telescope', 'see', 2], ['oven', 'bake', 1], ['needle', 'sew', 2], ['anchor', 'hold', 2],
    ['compass', 'navigate', 3], ['microscope', 'magnify', 3], ['shovel', 'dig', 1], ['whistle', 'signal', 2],
    ['filter', 'strain', 3], ['thermometer', 'measure', 2],
  ],
  worker_tool: [
    ['chef', 'knife', 1], ['painter', 'brush', 1], ['farmer', 'plow', 2], ['carpenter', 'saw', 2],
    ['dentist', 'drill', 2], ['sailor', 'compass', 2], ['surgeon', 'scalpel', 3], ['astronomer', 'telescope', 2],
    ['tailor', 'needle', 2], ['gardener', 'shovel', 1], ['drummer', 'sticks', 1], ['archer', 'bow', 2],
    ['cartographer', 'map', 3], ['blacksmith', 'anvil', 3],
  ],
  member_group: [
    ['bee', 'swarm', 2], ['wolf', 'pack', 2], ['fish', 'school', 2], ['bird', 'flock', 1],
    ['sailor', 'crew', 2], ['soldier', 'army', 1], ['singer', 'choir', 2], ['player', 'team', 1],
    ['star', 'constellation', 3], ['cow', 'herd', 1], ['judge', 'panel', 3], ['island', 'chain', 3],
  ],
  made_of: [
    ['window', 'glass', 1], ['ring', 'gold', 1], ['tire', 'rubber', 2], ['sweater', 'wool', 1],
    ['statue', 'marble', 2], ['fence', 'wood', 1], ['coin', 'copper', 2], ['bottle', 'glass', 1],
    ['pipe', 'iron', 2], ['rope', 'fiber', 3], ['brick', 'clay', 2], ['candle', 'wax', 1],
  ],
  degree: [
    ['warm', 'hot', 1], ['damp', 'soaked', 2], ['big', 'enormous', 1], ['sad', 'devastated', 2],
    ['tired', 'exhausted', 1], ['cool', 'frozen', 1], ['like', 'adore', 2], ['annoyed', 'furious', 2],
    ['bright', 'blinding', 2], ['quiet', 'silent', 1], ['hungry', 'starving', 1], ['clever', 'brilliant', 3],
    ['unusual', 'unprecedented', 3], ['dislike', 'despise', 3],
  ],
  cause_effect: [
    ['rain', 'flood', 2], ['spark', 'fire', 2], ['practice', 'skill', 2], ['drought', 'famine', 3],
    ['exercise', 'strength', 2], ['virus', 'illness', 2], ['friction', 'heat', 3], ['erosion', 'canyon', 3],
    ['study', 'knowledge', 1], ['frost', 'crack', 3], ['sunlight', 'growth', 2], ['neglect', 'decay', 3],
  ],
  lacks: [
    ['desert', 'water', 2], ['silence', 'sound', 2], ['vacuum', 'air', 3], ['darkness', 'light', 1],
    ['orphan', 'parents', 3], ['bald', 'hair', 1], ['empty', 'contents', 2], ['blind', 'sight', 2],
    ['barren', 'crops', 3], ['mute', 'speech', 3],
  ],
}

// Every word indexed by both positions, so the generator can ask "what else is
// this word associated with?" and pull a distractor through the wrong relation.
// Indexing heads alone would miss most of it: `hot` is a degree AND an opposite,
// `telescope` is a function AND a worker's tool.
export const PAIRS_BY_WORD = (() => {
  const index = new Map()
  const add = (word, entry) => {
    if (!index.has(word)) index.set(word, [])
    index.get(word).push(entry)
  }
  for (const [rel, pairs] of Object.entries(PAIRS)) {
    for (const [a, b, tier] of pairs) {
      const entry = { rel, a, b, tier }
      add(a, entry)
      if (b !== a) add(b, entry)
    }
  }
  return index
})()

// Tier a level should draw from: levels 1-4 stay in tier 1, the top levels mix
// in tier 3. Returns the tiers that are fair game.
export function tiersFor(level) {
  if (level <= 3) return [1]
  if (level <= 6) return [1, 2]
  if (level <= 9) return [2, 3]
  return [3, 2]
}
