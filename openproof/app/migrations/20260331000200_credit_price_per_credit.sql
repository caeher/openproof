ALTER TABLE credit_packages
    DROP CONSTRAINT IF EXISTS chk_credit_packages_price_sats;

ALTER TABLE credit_packages
    DROP COLUMN IF EXISTS price_sats;

UPDATE credit_packages
SET
    description = CASE code
        WHEN 'starter' THEN '15 creditos para pruebas y flujo inicial.'
        WHEN 'growth' THEN '50 creditos para operaciones recurrentes.'
        WHEN 'scale' THEN '200 creditos para equipos o volumen alto.'
        ELSE description
    END,
    updated_at = NOW();