ALTER TABLE brands
    ADD COLUMN IF NOT EXISTS logo_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS gallery_layout VARCHAR(50) NOT NULL DEFAULT 'grid';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'brands_gallery_layout_check'
          AND conrelid = 'brands'::regclass
    ) THEN
        ALTER TABLE brands
            ADD CONSTRAINT brands_gallery_layout_check
            CHECK (gallery_layout IN ('grid', 'masonry', 'mosaic', 'feature', 'carousel'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS brand_portfolio_images (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    image_url VARCHAR(512) NOT NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_brand_portfolio_display_order
        UNIQUE (brand_id, display_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_brand_portfolio_images_order
    ON brand_portfolio_images(brand_id, display_order, id);
