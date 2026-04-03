'use client'
import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

const METRICS = [
  { target: 200, prefix: '+', label: 'Negocios activos', sub: '' },
  { target: 0, prefix: 'Bs. ', label: 'Deuda sin rastrear', sub: '(con LUMIS)' },
  { target: 30, prefix: '', suffix: ' min', label: 'Actualización tasa BCV', sub: '' },
  { target: 99.9, prefix: '', suffix: '%', label: 'Uptime garantizado', sub: '' },
]

function Counter({ target, prefix = '', suffix = '' }: { target: number, prefix?: string, suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (isInView) {
      if (target === 0) {
        setCount(0)
        return
      }
      
      let start = 0
      const end = target
      const duration = 2000 // 2 seconds
      const frameRate = 1000 / 60
      const totalFrames = Math.round(duration / frameRate)
      const increment = end / totalFrames
      
      let currentFrame = 0
      const timer = setInterval(() => {
        currentFrame++
        const val = increment * currentFrame
        if (currentFrame >= totalFrames) {
          setCount(end)
          clearInterval(timer)
        } else {
          setCount(val)
        }
      }, frameRate)
      
      return () => clearInterval(timer)
    }
  }, [isInView, target])

  // Format decimals for 99.9 if needed
  const displayVal = target % 1 === 0 ? Math.floor(count) : count.toFixed(1)

  return <span ref={ref}>{prefix}{displayVal}{suffix}</span>
}

export function PainNumbers() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-24 bg-slate-50 border-y border-slate-200"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-0">
          {METRICS.map((item, i) => (
            <div 
              key={i} 
              className={`relative flex flex-col items-center text-center px-4
                          ${i !== METRICS.length - 1 ? 'md:border-r md:border-slate-200' : ''}`}
            >
              <div className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-3 tracking-tighter">
                <Counter target={item.target} prefix={item.prefix} suffix={item.suffix} />
              </div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                {item.label}
              </div>
              {item.sub && (
                <div className="text-[10px] font-bold text-[#E040FB]/60 uppercase tracking-widest">
                  {item.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
