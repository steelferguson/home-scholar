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

// Categories for classification and sentence items. `singular` is how the
// category reads inside a sentence ("a robin is a kind of BIRD"). `words` are
// members, tagged
// by tier the same way pairs are. `near` is the load-bearing part: words tightly
// ASSOCIATED with the category but not members of it -- feather for birds, nail
// for tools. They make the distractor that catches a kid answering on "this
// feels related" instead of "this is one of these", which is the same trap the
// analogies set, in a different shape.
export const CATEGORIES = {
  birds: { singular: 'bird',
    words: [['robin', 1], ['sparrow', 1], ['eagle', 1], ['owl', 1], ['hawk', 2], ['crow', 1], ['falcon', 2], ['heron', 3]], near: ['nest', 'feather', 'beak', 'perch'] },
  mammals: { singular: 'mammal',
    words: [['dog', 1], ['cat', 1], ['horse', 1], ['cow', 1], ['bear', 1], ['wolf', 2], ['fox', 2], ['otter', 3]], near: ['fur', 'paw', 'kennel', 'burrow'] },
  fruit: { singular: 'fruit',
    words: [['apple', 1], ['pear', 1], ['plum', 1], ['peach', 1], ['cherry', 1], ['mango', 2], ['apricot', 3]], near: ['seed', 'orchard', 'juice', 'peel'] },
  vegetables: { singular: 'vegetable',
    words: [['carrot', 1], ['pea', 1], ['bean', 1], ['potato', 1], ['onion', 2], ['spinach', 2], ['turnip', 3]], near: ['garden', 'soil', 'salad', 'harvest'] },
  tools: { singular: 'tool',
    words: [['hammer', 1], ['saw', 1], ['drill', 2], ['wrench', 2], ['pliers', 2], ['chisel', 3], ['screwdriver', 2]], near: ['nail', 'workbench', 'toolbox', 'plank'] },
  instruments: { singular: 'musical instrument',
    words: [['piano', 1], ['guitar', 1], ['drum', 1], ['flute', 2], ['violin', 2], ['trumpet', 2], ['cello', 3], ['oboe', 3]], near: ['song', 'stage', 'melody', 'orchestra'] },
  metals: { singular: 'metal', countable: false,
    words: [['gold', 1], ['silver', 1], ['iron', 2], ['copper', 2], ['tin', 2], ['lead', 3], ['zinc', 3]], near: ['rust', 'mine', 'ore', 'forge'] },
  shapes: { singular: 'shape',
    words: [['circle', 1], ['square', 1], ['triangle', 1], ['oval', 1], ['diamond', 2], ['hexagon', 2], ['pentagon', 3]], near: ['line', 'corner', 'angle', 'edge'] },
  colors: { singular: 'color', countable: false,
    words: [['red', 1], ['blue', 1], ['green', 1], ['yellow', 1], ['purple', 1], ['orange', 1], ['crimson', 3], ['amber', 3]], near: ['paint', 'brush', 'rainbow', 'shade'] },
  clothing: { singular: 'clothing',
    words: [['shirt', 1], ['coat', 1], ['hat', 1], ['sock', 1], ['glove', 1], ['scarf', 2], ['trousers', 2]], near: ['closet', 'button', 'zipper', 'hanger'] },
  furniture: { singular: 'furniture',
    words: [['chair', 1], ['table', 1], ['bed', 1], ['desk', 1], ['shelf', 2], ['couch', 2], ['wardrobe', 3]], near: ['room', 'cushion', 'carpet', 'lamp'] },
  weather: { singular: 'weather', countable: false,
    words: [['rain', 1], ['snow', 1], ['fog', 2], ['wind', 1], ['hail', 2], ['thunder', 2], ['sleet', 3]], near: ['umbrella', 'cloud', 'forecast', 'season'] },
  vehicles: { singular: 'vehicle',
    words: [['car', 1], ['truck', 1], ['bus', 1], ['train', 1], ['boat', 1], ['bicycle', 2], ['tractor', 2]], near: ['road', 'driver', 'garage', 'ticket'] },
  buildings: { singular: 'building',
    words: [['house', 1], ['school', 1], ['barn', 2], ['castle', 2], ['tower', 2], ['cottage', 3], ['cathedral', 3]], near: ['brick', 'roof', 'doorway', 'street'] },
  body_parts: { singular: 'body part',
    words: [['arm', 1], ['leg', 1], ['hand', 1], ['foot', 1], ['elbow', 2], ['knee', 2], ['shoulder', 2]], near: ['sleeve', 'bone', 'muscle', 'mitten'] },
  emotions: { singular: 'feeling', countable: false,
    words: [['joy', 2], ['anger', 2], ['fear', 2], ['sorrow', 3], ['envy', 3], ['pride', 3], ['relief', 3]], near: ['smile', 'tear', 'shout', 'sigh'] },
  time_units: { singular: 'length of time',
    words: [['hour', 1], ['minute', 1], ['week', 1], ['month', 1], ['year', 1], ['decade', 2], ['century', 3]], near: ['clock', 'calendar', 'watch', 'schedule'] },
  planets: { singular: 'planet',
    words: [['mars', 2], ['venus', 2], ['jupiter', 2], ['saturn', 2], ['mercury', 3], ['neptune', 3]], near: ['star', 'moon', 'comet', 'telescope'] },
  liquids: { singular: 'liquid', countable: false,
    words: [['water', 1], ['milk', 1], ['oil', 2], ['juice', 1], ['honey', 2], ['syrup', 3]], near: ['cup', 'bottle', 'straw', 'kettle'] },
  insects: { singular: 'insect',
    words: [['ant', 1], ['bee', 1], ['beetle', 2], ['moth', 2], ['wasp', 2], ['cricket', 3]], near: ['web', 'hive', 'sting', 'antenna'] },
}

// Members of a category that a given level is allowed to use.
export const membersFor = (category, tiers) =>
  CATEGORIES[category].words.filter(([, tier]) => tiers.includes(tier)).map(([word]) => word)

// Categories with enough usable members at this level to build an item.
export const categoriesFor = (tiers, needed) =>
  Object.keys(CATEGORIES).filter((name) => membersFor(name, tiers).length >= needed)

// Grammar tagging. Sentence templates prefix words with articles and pluralise
// them, and an 8-year-old reads these -- "a group of fishs", "a bald has almost
// no hair" and "a wind and a snow are both kinds of weather" all shipped before
// this existed. Rather than guess at inflection, the data says what each word
// is, and a template that cannot phrase a word correctly declines it and the
// generator re-rolls.

// Uncountable nouns: never "a gold", "a rain", "a knowledge".
export const MASS = new Set([
  'oxygen', 'gas', 'copper', 'granite', 'gold', 'silver', 'iron', 'tin', 'lead', 'zinc',
  'glass', 'marble', 'clay', 'wax', 'rubber', 'wood', 'wool', 'fiber', 'water', 'air',
  'sight', 'speech', 'hair', 'sound', 'silence', 'darkness', 'knowledge', 'strength',
  'skill', 'heat', 'growth', 'decay', 'famine', 'illness', 'friction', 'erosion',
  'sunlight', 'neglect', 'frost', 'drought', 'practice', 'study', 'exercise', 'rain',
  'snow', 'fog', 'wind', 'hail', 'thunder', 'sleet', 'milk', 'oil', 'juice', 'honey',
  'syrup', 'joy', 'anger', 'fear', 'sorrow', 'envy', 'pride', 'relief', 'clothing',
  'blue', 'red', 'green', 'yellow', 'purple', 'orange', 'crimson', 'amber',
  'furniture', 'weather', 'crops', 'parents', 'contents', 'light',
])

// Words that are adjectives, not nouns. "A blind has almost no sight" is the
// failure this prevents.
export const ADJECTIVES = new Set([
  'hot', 'cold', 'up', 'down', 'open', 'closed', 'fast', 'slow', 'heavy', 'ancient',
  'modern', 'warm', 'damp', 'soaked', 'big', 'enormous', 'sad', 'devastated', 'tired',
  'exhausted', 'cool', 'frozen', 'annoyed', 'furious', 'bright', 'blinding', 'quiet',
  'silent', 'hungry', 'starving', 'clever', 'brilliant', 'unusual', 'unprecedented',
  'generous', 'stingy', 'permanent', 'temporary', 'solid', 'liquid', 'bald', 'blind',
  'mute', 'barren', 'empty', 'expand', 'shrink',
])

// Nouns whose plural is not formed by adding s.
export const IRREGULAR_PLURAL = new Set(['fish', 'sheep', 'deer'])

export const isCountableNoun = (word) => !MASS.has(word) && !ADJECTIVES.has(word)
// Silent h takes "an" despite the consonant. Only `hour` occurs in these banks,
// but the set is the right place for the next one.
const SILENT_H = new Set(['hour', 'honest', 'heir'])
// Sentences are shown to a child; they start with a capital.
export const sentenceCase = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export const article = (word) => (SILENT_H.has(word) || /^[aeiou]/i.test(word) ? 'an' : 'a')
