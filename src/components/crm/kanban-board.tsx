"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { formatCurrency } from "@/lib/utils";
import { WhatsAppButton } from "./WhatsAppButton";
import { Star } from "lucide-react";
import { useCallback, useMemo } from "react";

interface KanbanBoardProps {
  oportunidades: any[];
  onUpdateEtapa: (id: string, etapa: string) => void;
  onSelectOp: (op: any) => void;
}

const ETAPAS = [
  { id: "prospecto", label: "Prospecto", color: "border-text-3" },
  { id: "cotizado", label: "Cotizado", color: "border-[#7C4DFF]" },
  { id: "por_cobrar", label: "Por Cobrar", color: "border-status-warning" },
  { id: "cerrado_ganado", label: "Cerrado ✓", color: "border-status-ok" },
];

export function KanbanBoard({ oportunidades, onUpdateEtapa, onSelectOp }: KanbanBoardProps) {
  // Agrupar oportunidades por etapa en un solo pase.
  // Antes, cada render iteraba el array completo 4 veces (una por etapa)
  // — con 100+ oportunidades y drag-drop triggereando renders constantes,
  // eso se notaba en devices modestos. Ahora es O(n) una vez por cambio.
  const opsByEtapa = useMemo(() => {
    const map: Record<string, any[]> = {};
    ETAPAS.forEach((e) => {
      map[e.id] = [];
    });
    for (const op of oportunidades) {
      if (map[op.etapa]) map[op.etapa].push(op);
    }
    return map;
  }, [oportunidades]);

  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) return;
      const sourceCol = result.source.droppableId;
      const destCol = result.destination.droppableId;
      if (sourceCol === destCol) return;
      onUpdateEtapa(result.draggableId, destCol);
    },
    [onUpdateEtapa],
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-full pb-4 overflow-x-auto min-w-max">
        {ETAPAS.map((etapa) => {
          const columnOps = opsByEtapa[etapa.id] || [];
          
          return (
            <div key={etapa.id} className="w-[300px] flex flex-col flex-shrink-0 bg-surface-base border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className={`p-4 border-b-2 ${etapa.color} bg-surface-hover/5 flex items-center justify-between`}>
                <h3 className="font-outfit font-bold text-text-1 uppercase tracking-widest text-[11px]">{etapa.label}</h3>
                <span className="bg-surface-elevated text-text-3 text-[10px] px-2 py-0.5 rounded-full font-mono">{columnOps.length}</span>
              </div>
              
              <Droppable droppableId={etapa.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 p-3 overflow-y-auto no-scrollbar space-y-3 transition-colors ${
                      snapshot.isDraggingOver ? "bg-brand/5" : "bg-transparent"
                    }`}
                  >
                    {columnOps.map((op, index) => (
                      <Draggable key={op.id} draggableId={op.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onSelectOp(op)}
                            className={`p-4 bg-surface-card border rounded-xl cursor-grab active:cursor-grabbing transition-all ${
                              snapshot.isDragging 
                                ? "shadow-[0_10px_40px_rgba(124,77,255,0.2)] border-brand scale-105 z-50 rotate-2" 
                                : "shadow-sm border-border hover:border-brand/40 hover:-translate-y-1"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-text-1 text-sm font-outfit uppercase tracking-wider">{op.partners?.name || "Sin cliente"}</h4>
                            </div>
                            
                            <p className="text-xs text-text-3 font-medium mb-3 min-h-[16px]">{op.titulo}</p>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest">Monto</span>
                                <span className="text-sm font-bold text-text-1 font-syne">{formatCurrency(op.monto_estimado)}</span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(star => (
                                    <Star 
                                      key={star} 
                                      className={`w-3 h-3 ${star <= (op.calificacion || 0) ? "text-status-warning fill-status-warning" : "text-border"}`} 
                                    />
                                  ))}
                                </div>
                                {op.partners?.phone && (
                                  <WhatsAppButton 
                                    telefono={op.partners.phone} 
                                    nombre={op.partners.name} 
                                    clienteId={op.cliente_id}
                                    oportunidadId={op.id}
                                    size="sm" 
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
