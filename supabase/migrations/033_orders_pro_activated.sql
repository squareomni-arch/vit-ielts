-- 033_orders_pro_activated.sql
-- Idempotency guard for PRO activation in the SePay webhook.
--
-- Problem: PRO activation runs AFTER an order is marked `completed`. If
-- activateProAccount() threw (e.g. a transient DB blip), the order stayed
-- `completed`, the webhook returned 200 (so SePay never retried), and the
-- customer ended up paying without ever receiving PRO.
--
-- Fix: track whether fulfillment (PRO grant) actually succeeded, separately
-- from the order status. The webhook now keys activation on this flag so a
-- retry re-attempts the grant, and only flips the flag once the grant lands.
-- Additive only — never resets existing orders.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS pro_activated boolean NOT NULL DEFAULT false;

-- Backfill: existing completed orders are assumed already fulfilled, so we
-- don't want a future retry to double-grant them.
UPDATE orders SET pro_activated = true WHERE status = 'completed';
