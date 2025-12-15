-- Add tsvector columns for full-text search

-- Card search: title, description (can use GENERATED ALWAYS)
ALTER TABLE cards
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(description, '')), 'D')
) STORED;

-- Budget search: code (with # prefix), client name, client phone
-- Cannot use GENERATED ALWAYS with subqueries, so we add a nullable column
ALTER TABLE budgets
ADD COLUMN search_vector tsvector;

-- Function to update budget search_vector
CREATE OR REPLACE FUNCTION update_budget_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE('#' || NEW.code::text, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE((SELECT name FROM clients WHERE id = NEW."clientId"), '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE((SELECT phone FROM clients WHERE id = NEW."clientId"), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update budget search_vector on INSERT or UPDATE
CREATE TRIGGER budget_search_vector_update
BEFORE INSERT OR UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION update_budget_search_vector();

-- Function to update budget search_vector when client changes
CREATE OR REPLACE FUNCTION update_budgets_on_client_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all budgets linked to this client
  UPDATE budgets
  SET search_vector =
    setweight(to_tsvector('portuguese', COALESCE('#' || code::text, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.phone, '')), 'C')
  WHERE "clientId" = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on clients table to update related budgets
CREATE TRIGGER client_update_budgets_search
AFTER UPDATE OF name, phone ON clients
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.phone IS DISTINCT FROM NEW.phone)
EXECUTE FUNCTION update_budgets_on_client_change();

-- Populate existing budgets search_vector
UPDATE budgets b
SET search_vector =
  setweight(to_tsvector('portuguese', COALESCE('#' || b.code::text, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE((SELECT name FROM clients WHERE id = b."clientId"), '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE((SELECT phone FROM clients WHERE id = b."clientId"), '')), 'C');

-- Create GiST indexes for performance
CREATE INDEX budgets_search_vector_idx ON budgets USING GiST (search_vector);
CREATE INDEX cards_search_vector_idx ON cards USING GiST (search_vector);
