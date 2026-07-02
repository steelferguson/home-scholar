import ReactMarkdown from 'react-markdown'
import MathBlock from './MathBlock'
import QuizStep from './QuizStep'
import { WIDGETS } from './widgets'

function Markdown({ md, className = '' }) {
  return (
    <div className={`prose prose-sm sm:prose max-w-none text-gray-700 ${className}`}>
      <ReactMarkdown>{md}</ReactMarkdown>
    </div>
  )
}

export default function StepRenderer({ step }) {
  switch (step.type) {
    case 'text':
      return <Markdown md={step.md} />

    case 'image':
      return (
        <figure className="my-4">
          <img src={step.src} alt={step.caption || ''} className="rounded-lg mx-auto max-h-96" />
          {step.caption && <figcaption className="text-sm text-gray-500 text-center mt-2">{step.caption}</figcaption>}
        </figure>
      )

    case 'math':
      return (
        <div>
          {step.md && <Markdown md={step.md} className="mb-2" />}
          <MathBlock tex={step.tex} caption={step.caption} />
        </div>
      )

    case 'quiz':
      return <QuizStep question={step.question} choices={step.choices} answer={step.answer} explain={step.explain} />

    case 'video':
      return (
        <figure className="my-4">
          <video src={step.src} controls className="rounded-lg w-full" />
          {step.caption && <figcaption className="text-sm text-gray-500 text-center mt-2">{step.caption}</figcaption>}
        </figure>
      )

    case 'widget': {
      const Widget = WIDGETS[step.widget]
      if (!Widget) {
        return (
          <div className="my-4 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            This lesson includes an interactive element (&ldquo;{step.widget}&rdquo;) that isn&apos;t supported in this version of the app yet.
          </div>
        )
      }
      return (
        <div>
          {step.md && <Markdown md={step.md} className="mb-3" />}
          <Widget {...(step.props || {})} />
        </div>
      )
    }

    default:
      return (
        <div className="my-4 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          Unsupported step type: {step.type}
        </div>
      )
  }
}
