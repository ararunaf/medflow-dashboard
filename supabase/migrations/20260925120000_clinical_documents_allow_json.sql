-- Captura Inteligente: o bucket `clinical-documents` precisa aceitar JSON.
--
-- `storeDocumentFile` grava, logo após o original, o manifesto de auditoria
-- (`{tenant}/{sessão}/audit/...json`, content-type application/json), e as
-- etapas do pipeline persistem artefatos JSON (OCR, guia estruturada,
-- auditoria, propostas de correção) no mesmo bucket. A allowlist criada em
-- 20260703120000_intelligent_capture_foundation.sql não incluía
-- application/json, então o Storage recusava o manifesto ("mime type
-- application/json is not supported") e todo upload de captura falhava antes
-- de gravar `capture_documents`.
--
-- Acrescenta application/json preservando os tipos já liberados.
UPDATE storage.buckets
SET allowed_mime_types = array_append(allowed_mime_types, 'application/json')
WHERE id = 'clinical-documents'
  AND allowed_mime_types IS NOT NULL
  AND NOT ('application/json' = ANY (allowed_mime_types));
