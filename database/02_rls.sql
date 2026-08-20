-- ePlače 2026 — Row-Level Security (H3 dokaz)
-- Poženi PO 01_schema.sql

USE eplace2026;
GO

-- Varnostna funkcija predikata
CREATE OR ALTER FUNCTION dbo.fn_securitypredicate (@tenant_id UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
  SELECT 1 AS fn_result
  WHERE CAST(SESSION_CONTEXT(N'tenant_id') AS UNIQUEIDENTIFIER) = @tenant_id;
GO

-- Varnostna politika — pokriva vse tenant-scoped tabele
IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = 'EmployeeRLSPolicy')
  DROP SECURITY POLICY dbo.EmployeeRLSPolicy;
GO

CREATE SECURITY POLICY dbo.EmployeeRLSPolicy
  ADD FILTER PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.employees,
  ADD BLOCK  PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.employees AFTER INSERT,
  ADD FILTER PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.monthly_hours,
  ADD BLOCK  PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.monthly_hours AFTER INSERT,
  ADD FILTER PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.payroll_runs,
  ADD BLOCK  PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.payroll_runs AFTER INSERT,
  ADD FILTER PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.payroll_lines,
  ADD BLOCK  PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.payroll_lines AFTER INSERT,
  ADD FILTER PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.audit_logs,
  ADD BLOCK  PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.audit_logs AFTER INSERT
WITH (STATE = ON);
GO

PRINT 'RLS policy created successfully.';
PRINT '';
PRINT 'H3 test — pozeni te ukaze v SSMS:';
PRINT '  SELECT COUNT(*) FROM dbo.employees;  -- pricakovano: 0 (brez konteksta)';
