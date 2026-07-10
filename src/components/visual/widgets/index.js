import TokenizerPlayground from './TokenizerPlayground'
import LogExplorer from './LogExplorer'
import SoftmaxSlider from './SoftmaxSlider'
import GradientDescentBall from './GradientDescentBall'
import EmbeddingSpace from './EmbeddingSpace'
import AttentionHeatmap from './AttentionHeatmap'
import BeforeAfter from './BeforeAfter'
import WordHunt from './WordHunt'
import PracticeTimer from './PracticeTimer'

// Registry: lesson JSON references widgets by id, so content stays code-free.
// Adding a new visualization = add a component here; old app versions render
// a graceful fallback for widget ids they don't know.
export const WIDGETS = {
  'tokenizer-playground': TokenizerPlayground,
  'log-explorer': LogExplorer,
  'softmax-slider': SoftmaxSlider,
  'gradient-descent-ball': GradientDescentBall,
  'embedding-space': EmbeddingSpace,
  'attention-heatmap': AttentionHeatmap,
  'before-after': BeforeAfter,
  'word-hunt': WordHunt,
  'practice-timer': PracticeTimer,
}
