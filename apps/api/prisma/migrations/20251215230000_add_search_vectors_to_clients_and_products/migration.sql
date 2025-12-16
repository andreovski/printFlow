-- Add tsvector columns for full-text search to clients and products tables

-- Client search: name (weight A), phone/document (weight B), email (weight C)
ALTER TABLE clients
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(phone, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(document, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(email, '')), 'C')
) STORED;

-- Product search: title (weight A), code (weight B), description (weight D)
ALTER TABLE products
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(code, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(description, '')), 'D')
) STORED;

-- Create GiST indexes for performance
CREATE INDEX clients_search_vector_idx ON clients USING GiST (search_vector);
CREATE INDEX products_search_vector_idx ON products USING GiST (search_vector);
