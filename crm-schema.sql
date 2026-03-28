-- Oportunidades del CRM (el corazón del Kanban)
CREATE TABLE crm_oportunidades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  monto_estimado numeric DEFAULT 0,
  etapa text DEFAULT 'prospecto'
    CHECK (etapa IN ('prospecto', 'cotizado', 'por_cobrar', 'cerrado_ganado', 'cerrado_perdido')),
  score integer DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  calificacion integer DEFAULT 0 CHECK (calificacion BETWEEN 0 AND 5),
  notas text,
  proximo_contacto timestamptz,
  agente_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Historial de interacciones por cliente
CREATE TABLE crm_interacciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES partners(id) ON DELETE CASCADE,
  oportunidad_id uuid REFERENCES crm_oportunidades(id) ON DELETE SET NULL,
  tipo text CHECK (tipo IN ('whatsapp', 'llamada', 'nota', 'correo', 'reunion')),
  contenido text NOT NULL,
  agente_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS: cada empresa solo ve sus datos
ALTER TABLE crm_oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_oportunidades" ON crm_oportunidades
  USING (company_id = get_auth_company_id());

ALTER TABLE crm_interacciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_interacciones" ON crm_interacciones
  USING (company_id = get_auth_company_id());

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER oportunidades_updated_at
  BEFORE UPDATE ON crm_oportunidades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
