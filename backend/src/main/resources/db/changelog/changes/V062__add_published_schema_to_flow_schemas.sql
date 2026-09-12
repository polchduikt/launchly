ALTER TABLE flow_schemas
ADD COLUMN IF NOT EXISTS published_nodes jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS published_edges jsonb DEFAULT '[]'::jsonb;

-- Populate existing schemas so published version matches current nodes/edges
UPDATE flow_schemas
SET published_nodes = nodes,
    published_edges = edges
WHERE published_nodes IS NULL OR published_nodes = '[]'::jsonb;
