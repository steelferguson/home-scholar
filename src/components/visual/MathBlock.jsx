import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function MathBlock({ tex, caption }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: true })
  return (
    <div className="my-4">
      <div className="overflow-x-auto py-2" dangerouslySetInnerHTML={{ __html: html }} />
      {caption && <p className="text-sm text-gray-500 text-center mt-1">{caption}</p>}
    </div>
  )
}
