'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gift,
  Shield,
  Wifi,
  Smartphone,
  Receipt,
  CreditCard,
  Download,
  ArrowRightLeft,
  GraduationCap,
  Headphones,
  ChevronDown,
  MessageCircle,
  HelpCircle,
} from 'lucide-react'

type FaqItem = {
  icon: React.ComponentType<{ className?: string }>
  question: string
  answer: React.ReactNode
}

const ITEMS: FaqItem[] = [
  {
    icon: Gift,
    question: '¿Realmente es gratis los 15 días? ¿Me van a cobrar sin avisar?',
    answer: (
      <>
        Cero trampas. No pedimos tarjeta de crédito para activar la demo, así que{' '}
        <strong className="font-semibold text-slate-900">
          es imposible que te cobremos
        </strong>
        . Cuando terminen los 15 días, si no has elegido un plan pago, tu cuenta
        queda pausada — pero tus datos siguen ahí esperándote. Tú decides cuándo
        volver.
      </>
    ),
  },
  {
    icon: Shield,
    question: '¿Qué pasa con mis datos si dejo de usar LUMIS?',
    answer: (
      <>
        Tus datos son tuyos, siempre. Puedes exportar TODO (productos, clientes,
        ventas, cobranzas) a Excel/CSV con un clic desde el panel. Si decides irte,
        te vas con tu información completa. Sin retener nada, sin drama.
      </>
    ),
  },
  {
    icon: Wifi,
    question: '¿Funciona con mala conexión o si se va el internet?',
    answer: (
      <>
        LUMIS es 100% web, así que sí necesita internet — pero está optimizado
        para conexiones venezolanas. Si se va la luz un rato, cuando vuelvas todo
        estará sincronizado. Si la conexión es intermitente, la app aguanta y
        reconecta sola sin que pierdas lo que estabas haciendo.
      </>
    ),
  },
  {
    icon: Smartphone,
    question: '¿Lo puedo usar desde el celular?',
    answer: (
      <>
        Sí. LUMIS se ve perfecto en cualquier celular con navegador (iPhone,
        Android, el que sea). No necesitas descargar una app de las tiendas —
        solo abres tu navegador, entras a LUMIS, y listo. Tu vendedor puede
        facturar desde su teléfono mientras está con el cliente.
      </>
    ),
  },
  {
    icon: Receipt,
    question: '¿Emite facturas con formato SENIAT?',
    answer: (
      <>
        LUMIS genera comprobantes de venta con la estructura estándar que pide
        el SENIAT (datos del emisor, receptor, IVA, IGTF cuando aplica). Para
        factura fiscal homologada con máquina fiscal estamos trabajando la
        integración — si ese es un must para tu negocio,{' '}
        <a
          href="https://wa.me/584149406419?text=Hola%2C%20quiero%20info%20sobre%20facturaci%C3%B3n%20fiscal"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#A855F7] font-semibold underline decoration-dashed"
        >
          escríbenos por WhatsApp
        </a>{' '}
        y te contamos el timeline.
      </>
    ),
  },
  {
    icon: CreditCard,
    question: '¿Cómo pago el plan mensual? ¿Aceptan Pago Móvil?',
    answer: (
      <>
        Sí: <strong className="font-semibold text-slate-900">Pago Móvil</strong>,{' '}
        <strong className="font-semibold text-slate-900">Zinli</strong>,{' '}
        <strong className="font-semibold text-slate-900">Binance Pay</strong> y
        transferencia. Subes tu comprobante desde el panel, nuestro equipo lo
        verifica (usualmente en minutos) y tu cuenta queda activa.
      </>
    ),
  },
  {
    icon: Download,
    question: '¿Necesito instalar algo en mi computadora?',
    answer: (
      <>
        Nada. LUMIS funciona 100% en tu navegador — Chrome, Safari, Edge, el que
        uses. Solo entras a <code className="font-mono text-[#A855F7]">uselumisapp.com</code>,
        inicias sesión y estás adentro. Sin instaladores, sin actualizaciones
        molestas, sin "¿dónde guardé el archivo?".
      </>
    ),
  },
  {
    icon: ArrowRightLeft,
    question: '¿Pueden migrar mi Excel o mi sistema actual?',
    answer: (
      <>
        Sí. LUMIS acepta carga masiva por CSV/Excel para productos, clientes y
        proveedores. Si tu data está ordenada, la subes tú mismo en 5 minutos.
        Si está hecha un desastre{' '}
        <em className="font-zilla italic">(como suele pasar)</em>, nuestro equipo
        te ayuda a limpiarla y migrarla — sin costo adicional durante los 15
        días de demo.
      </>
    ),
  },
  {
    icon: GraduationCap,
    question: '¿Cuánta capacitación necesito? ¿Es difícil de usar?',
    answer: (
      <>
        La mayoría de nuestros clientes están facturando en{' '}
        <strong className="font-semibold text-slate-900">15 minutos</strong>
        {' '}desde que entran. LUMIS está hecho para que lo use gente que nunca
        tocó un ERP en su vida — con interfaz limpia y guías paso a paso. Si
        tienes empleados que van a usarlo, te damos una guía rápida para que
        entrenes a tu equipo en menos de una hora.
      </>
    ),
  },
  {
    icon: Headphones,
    question: '¿El soporte es real o es un chatbot aburrido?',
    answer: (
      <>
        Es un equipo de personas venezolanas que hablan tu mismo idioma.
        Respondemos por WhatsApp de{' '}
        <strong className="font-semibold text-slate-900">
          lunes a sábado, 9am-6pm
        </strong>
        . Los clientes Pro y Enterprise tienen soporte prioritario con tiempo
        de respuesta garantizado. Nada de "press 1 for Spanish", nada de
        tickets perdidos.
      </>
    ),
  },
]

function FaqRow({
  item,
  isOpen,
  onToggle,
  index,
}: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  const Icon = item.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
      className={`rounded-2xl border transition-all duration-300 ${
        isOpen
          ? 'bg-gradient-to-br from-[#EC4899]/5 via-white to-[#6366F1]/5 border-[#A855F7]/25 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-start sm:items-center gap-4"
      >
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
            isOpen
              ? 'bg-gradient-to-br from-[#EC4899] to-[#A855F7] shadow-[0_6px_20px_rgba(168,85,247,0.35)]'
              : 'bg-slate-100'
          }`}
        >
          <Icon
            className={`w-4 h-4 sm:w-5 sm:h-5 ${
              isOpen ? 'text-white' : 'text-slate-500'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0 pt-1 sm:pt-0">
          <h3
            className={`font-outfit text-[15px] sm:text-base font-bold leading-snug ${
              isOpen ? 'text-slate-900' : 'text-slate-800'
            }`}
          >
            {item.question}
          </h3>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
            isOpen
              ? 'bg-[#A855F7]/10 text-[#A855F7]'
              : 'bg-slate-100 text-slate-400'
          }`}
        >
          <ChevronDown className="w-4 h-4" strokeWidth={3} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pl-[calc(2.25rem+1rem)] sm:pl-[calc(2.5rem+1rem+0.5rem)]">
              <div className="font-zilla text-[15px] sm:text-base text-slate-600 leading-relaxed">
                {item.answer}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0) // first open by default

  return (
    <section
      id="faq"
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#E040FB_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.02] pointer-events-none" />
      <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-[#A855F7]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-[#6366F1]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* ─── Header ─── */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-5 sm:mb-6 bg-gradient-to-r from-[#EC4899]/10 to-[#6366F1]/10 border border-[#A855F7]/20"
          >
            <HelpCircle className="w-3 h-3 text-[#A855F7]" />
            <span className="text-[9px] sm:text-[10px] font-bold text-[#A855F7] tracking-[0.15em] sm:tracking-[0.18em] uppercase font-outfit">
              Preguntas frecuentes
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-outfit font-bold text-[32px] sm:text-[42px] md:text-[52px] leading-[1.1] tracking-tight mb-5 text-slate-900"
          >
            Lo que{' '}
            <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent font-zilla italic font-medium pr-1">
              todos
            </span>{' '}
            nos preguntan.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-zilla text-base sm:text-lg text-slate-500 leading-relaxed"
          >
            Las dudas más comunes antes de empezar.
            Si tu pregunta no está aquí, escríbenos y te respondemos.
          </motion.p>
        </div>

        {/* ─── Accordion ─── */}
        <div className="space-y-3 mb-12 sm:mb-16">
          {ITEMS.map((item, i) => (
            <FaqRow
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              index={i}
            />
          ))}
        </div>

        {/* ─── WhatsApp CTA ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center"
        >
          <div className="inline-flex flex-col items-center gap-5 bg-white border border-slate-200 rounded-3xl px-8 py-8 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366]/20 to-[#25D366]/5 flex items-center justify-center border border-[#25D366]/20">
              <MessageCircle className="w-6 h-6 text-[#1da851]" />
            </div>
            <div>
              <p className="font-outfit font-bold text-lg sm:text-xl text-slate-900 mb-1">
                ¿Tienes otra pregunta?
              </p>
              <p className="font-zilla text-sm sm:text-base text-slate-500 max-w-md leading-relaxed">
                Escríbenos por WhatsApp y te respondemos en minutos.
                Equipo venezolano, sin chatbots.
              </p>
            </div>
            <motion.a
              href="https://wa.me/584149406419?text=Hola%20LUMIS%2C%20tengo%20una%20pregunta"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white bg-[#25D366] hover:bg-[#1da851] shadow-[0_8px_24px_rgba(37,211,102,0.3)] transition-all font-outfit active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Escribir por WhatsApp
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
