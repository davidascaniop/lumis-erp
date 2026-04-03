'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  Truck, Store, Wrench, Pill, Settings, 
  FileBox, Wine, BookOpen, Globe 
} from 'lucide-react'

const INDUSTRIES = [
  { icon: Truck, name: 'Distribuidoras de consumo masivo', desc: 'Control multi-sede y rutas.' },
  { icon: Store, name: 'Mayoristas y depósitos', desc: 'Gestión de bultos y paletas.' },
  { icon: Wrench, name: 'Ferreterías y construcción', desc: 'Skus infinitos organizados.' },
  { icon: Pill, name: 'Farmacias y botiquines', desc: 'Lotes y fechas de vencimiento.' },
  { icon: Settings, name: 'Repuestos y autopartes', desc: 'Búsqueda por código de fábrica.' },
  { icon: FileBox, name: 'Empresas de servicios', desc: 'Facturación rápida y cobros.' },
  { icon: Wine, name: 'Licorerías y abastos', desc: 'Rapidez en caja y stock.' },
  { icon: BookOpen, name: 'Papelerías y suministros', desc: 'Variedad de artículos controlados.' },
  { icon: Globe, name: 'Negocios Bs. y USD', desc: 'Multimoneda real en cada venta.' },
]

export function Industries() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 bg-white relative px-6 overflow-hidden"
      id="industrias"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="font-display font-bold text-4xl md:text-6xl text-slate-900 mb-6 tracking-tight leading-tight"
          >
            Si vendes, 
            <br />
            <span className="text-[#E040FB]">LUMIS es para ti.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-slate-500 text-lg max-w-xl mx-auto"
          >
            Diseñado para cualquier negocio venezolano que maneje inventario,
            clientes y cobros recurrentes.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INDUSTRIES.map((ind, i) => (
            <motion.div 
               key={i}
               initial={{ opacity: 0, y: 20 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.1 * i, duration: 0.5 }}
               whileHover={{ y: -4 }}
               className="group flex flex-col p-8 rounded-3xl bg-white border border-slate-200 transition-all duration-300 hover:border-[#E040FB]/40 hover:shadow-md shadow-sm"
            >
               <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-8 group-hover:bg-[#E040FB]/10 transition-colors">
                  <ind.icon className="w-6 h-6 text-slate-500 group-hover:text-[#E040FB] transition-colors" />
               </div>

               <h3 className="text-[17px] font-bold text-slate-900 mb-2 tracking-tight group-hover:text-[#E040FB] transition-colors">
                  {ind.name}
               </h3>
               <p className="text-sm text-slate-500 leading-relaxed font-normal">
                  {ind.desc}
               </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
