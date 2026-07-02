import { useState } from 'react'

// Toy BPE-style vocabulary: greedy longest-match against common sub-word chunks.
// Real tokenizers learn merges from data; this is a hand-picked set that produces
// realistic-looking splits for demo purposes.
const VOCAB = [
  'tokenization', 'tokenizer', 'token', 'ization', 'izing', 'ize',
  'believ', 'able', 'ability', 'un', 'dis', 'pre', 're', 'anti', 'inter', 'trans',
  'ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ment', 'ness', 'ful', 'less', 'ous',
  'the', 'and', 'that', 'have', 'with', 'this', 'from', 'they', 'what', 'about',
  'model', 'language', 'attention', 'learn', 'network', 'neural', 'gradient',
  'form', 'work', 'play', 'walk', 'run', 'jump', 'read', 'write', 'think',
  'cat', 'dog', 'house', 'water', 'light', 'over', 'under', 'out', 'in', 'on', 'at',
  'ck', 'th', 'sh', 'ch', 'qu', 'ea', 'ou', 'ai', 'oo', 'ee', 'st', 'nd', 'll',
]

const COLORS = [
  'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800', 'bg-pink-100 text-pink-800', 'bg-cyan-100 text-cyan-800',
]

function tokenizeWord(word) {
  const tokens = []
  let i = 0
  const lower = word.toLowerCase()
  while (i < lower.length) {
    let match = null
    for (const piece of VOCAB) {
      if (piece.length > 1 && lower.startsWith(piece, i) && (!match || piece.length > match.length)) {
        match = piece
      }
    }
    if (match) {
      tokens.push(word.slice(i, i + match.length))
      i += match.length
    } else {
      tokens.push(word.slice(i, i + 1))
      i += 1
    }
  }
  return tokens
}

function tokenize(text) {
  const tokens = []
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue
    if (/^\s+$/.test(part)) continue
    // Split off punctuation as its own tokens, like real tokenizers tend to
    for (const chunk of part.split(/([^a-zA-Z0-9']+)/)) {
      if (!chunk) continue
      if (/^[a-zA-Z0-9']+$/.test(chunk)) tokens.push(...tokenizeWord(chunk))
      else tokens.push(...chunk.split(''))
    }
  }
  return tokens
}

export default function TokenizerPlayground({ sampleText = 'The unbelievable tokenization' }) {
  const [text, setText] = useState(sampleText)
  const tokens = tokenize(text)
  const chars = text.replace(/\s/g, '').length

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Type anything — watch it split into tokens
      </label>
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Try: unbelievable, tokenization, supercalifragilistic..."
      />
      <div className="flex flex-wrap gap-1.5 mb-3 min-h-10">
        {tokens.map((t, i) => (
          <span key={i} className={`px-2 py-1 rounded-md text-sm font-mono ${COLORS[i % COLORS.length]}`}>
            {t}
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-700">{tokens.length} tokens</span> from {chars} characters
        — common chunks stay whole, rare words shatter into pieces.
      </p>
    </div>
  )
}
