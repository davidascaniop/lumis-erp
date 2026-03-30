-- ============================================================
-- LUMIS CRM — CENTRO DE MENSAJERÍA
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Configuración WhatsApp por empresa (multi-tenant)
CREATE TABLE IF NOT EXISTS crm_whatsapp_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  api_url         TEXT NOT NULL DEFAULT '',          -- URL de Evolution API del cliente
  instance_name   TEXT NOT NULL DEFAULT '',          -- Nombre de instancia
  api_token       TEXT NOT NULL DEFAULT '',          -- Token de autenticación
  is_connected    BOOLEAN DEFAULT false,
  qr_code         TEXT,                              -- Base64 del QR temporal
  phone_number    VARCHAR(20),                       -- Número vinculado
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chats (conversaciones)
CREATE TABLE IF NOT EXISTS crm_chats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  partner_id      UUID REFERENCES partners(id) ON DELETE SET NULL,
  remote_jid      TEXT NOT NULL,                     -- ID de WhatsApp (ej: 58412xxx@s.whatsapp.net)
  contact_name    TEXT,
  contact_phone   TEXT,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count    INT DEFAULT 0,
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  status          VARCHAR(30) DEFAULT 'sin_asignar', -- sin_asignar | activo | cerrado
  tags            TEXT[] DEFAULT '{}',               -- deudor, lead, urgente
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mensajes
CREATE TABLE IF NOT EXISTS crm_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id         UUID REFERENCES crm_chats(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  message_type    VARCHAR(20) DEFAULT 'text',        -- text | image | pdf | audio
  direction       VARCHAR(10) NOT NULL,              -- inbound | outbound
  is_internal     BOOLEAN DEFAULT false,             -- Nota interna (no llega al cliente)
  sent_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  wa_message_id   TEXT,                              -- ID del mensaje en WhatsApp
  status          VARCHAR(20) DEFAULT 'sent',        -- sent | delivered | read | failed
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Respuestas rápidas (Slash commands)
CREATE TABLE IF NOT EXISTS crm_quick_replies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  shortcut        VARCHAR(50) NOT NULL,              -- ej: /precios
  title           VARCHAR(100) NOT NULL,
  content         TEXT NOT NULL,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, shortcut)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_crm_chats_company   ON crm_chats(company_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_chats_assigned  ON crm_chats(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_crm_messages_chat   ON crm_messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_crm_messages_company ON crm_messages(company_id);

-- ============================================================
-- RLS — Cada empresa solo ve sus propios datos
-- ============================================================
ALTER TABLE crm_whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_chats             ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_quick_replies     ENABLE ROW LEVEL SECURITY;

-- WhatsApp settings: solo la propia empresa
CREATE POLICY "wa_settings_own" ON crm_whatsapp_settings FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid()));

-- Chats: empresa propia
CREATE POLICY "chats_own" ON crm_chats FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid()));

-- Mensajes: empresa propia
CREATE POLICY "messages_own" ON crm_messages FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid()));

-- Quick replies: empresa propia
CREATE POLICY "quick_replies_own" ON crm_quick_replies FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- SEMILLA: Respuestas rápidas de ejemplo
-- (Reemplaza 'TU_COMPANY_ID' antes de ejecutar o hazlo desde la app)
-- ============================================================
-- INSERT INTO crm_quick_replies (company_id, shortcut, title, content) VALUES
--   ('TU_COMPANY_ID', '/hola',    'Saludo inicial',   'Hola, bienvenido 👋 ¿En qué le podemos ayudar hoy?'),
--   ('TU_COMPANY_ID', '/precios', 'Lista de precios',  'Nuestra lista de precios actualizada está disponible. ¿Desea que se la enviemos?'),
--   ('TU_COMPANY_ID', '/datos',   'Datos de pago',     'Nuestros datos bancarios son: Banco..., Cuenta..., RIF...');

-- ============================================================
-- REALTIME (habilitar en Supabase Dashboard > Database > Replication)
-- Asegúrate de añadir crm_chats y crm_messages a la lista de tablas con Realtime habilitado
-- ============================================================
