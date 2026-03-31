ALTER TABLE credit_packages RENAME COLUMN price_usd_cents TO price_sats;

ALTER TABLE payment_intents RENAME COLUMN amount_usd_cents TO amount_sats;

ALTER TABLE credit_packages
    DROP CONSTRAINT IF EXISTS chk_credit_packages_price,
    ADD CONSTRAINT chk_credit_packages_price_sats CHECK (price_sats > 0);

UPDATE credit_packages
SET
    price_sats = credits * 10000,
    description = CASE code
        WHEN 'starter' THEN '15 creditos para pruebas y flujo inicial por 150000 sats.'
        WHEN 'growth' THEN '50 creditos para operaciones recurrentes por 500000 sats.'
        WHEN 'scale' THEN '200 creditos para equipos o volumen alto por 2000000 sats.'
        ELSE description
    END,
    updated_at = NOW();
