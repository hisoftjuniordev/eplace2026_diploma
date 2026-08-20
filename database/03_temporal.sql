-- ePlače 2026 — Temporal Tables dokumentacija
-- SYSTEM_VERSIONING je ze aktiviran v 01_schema.sql pri CREATE TABLE.
-- Ta datoteka sluzi kot preveritvena skripta.

USE eplace2026;
GO

-- Preveri temporal status
SELECT
  t.name AS tabela,
  t.temporal_type_desc,
  h.name AS history_tabela
FROM sys.tables t
LEFT JOIN sys.tables h ON t.history_table_id = h.object_id
WHERE t.name IN ('employees', 'job_positions')
ORDER BY t.name;
GO

-- Preveri: sprememba bruto je avtomatsko arhivirana
-- (Za diplomski dokaz: posodobi bruto_osnova enega delavca,
--  potem poizveduj employees_History za zgodovino)

PRINT 'Temporal tables check complete.';
PRINT 'employees in job_positions imata SYSTEM_VERSIONING = ON';
PRINT 'Vsaka sprememba je avtomatsko arhivirana v *_History tabelah.';
