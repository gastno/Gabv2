import psycopg2
import sys

# Database Configuration matching containerized deployment environment
DB_CONFIG = {
    "dbname": "appointment_db",
    "user": "db_user",
    "password": "db_password_123",
    "host": "localhost",
    "port": "5432"
}

def seed_database():
    conn = None
    try:
        print("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        print("Connection established. Executing database seeding transaction...")

        # 1. System Roles Seeding
        cursor.execute("""
            INSERT INTO roles (id, name, description) VALUES 
                (1, 'super_admin', 'Full system access'),
                (2, 'admin', 'Brand administrator access'),
                (3, 'staff', 'Specialist staff account')
            ON CONFLICT (name) DO NOTHING;
        """)

        # 2. Brands Seeding
        cursor.execute("""
            INSERT INTO brands (id, name, slug, location, about_description) VALUES
                (1, 'Gabbablu', 'gabbablu', 'Reykjavík, Iceland', 'Premier lash and brow specialist salon'),
                (2, 'Amor Tattoo', 'amor-tattoo', 'Reykjavík, Iceland', 'Tattoo and piercing studio')
            ON CONFLICT (id) DO NOTHING;
        """)

        # 3. Initial Staff Seeding
        cursor.execute("""
            INSERT INTO staff (id, role_id, username, password_hash, full_name, description) VALUES
                (1, 2, 'gabbablu', '$2b$10$1IUDHUtOhELtoGJF44RFZug4ZT7DuxSuoX/uxgwEIbHaf50y978ne', 'Gabbablu Admin', 'Brand Administrator')
            ON CONFLICT (username) DO NOTHING;
        """)

        # 4. Staff Brand Linkage Seeding
        cursor.execute("""
            INSERT INTO staff_brands (staff_id, brand_id) VALUES (1, 1)
            ON CONFLICT DO NOTHING;
        """)

        # 5. SEQUENCE SYNCHRONIZATION
        # Synchronizes PostgreSQL implicit sequence counters with explicit primary keys inserted above.
        print("Synchronizing table primary key sequences...")
        tables_to_sync = ['roles', 'brands', 'staff', 'categories', 'services', 'customers', 'appointments']
        
        for table in tables_to_sync:
            cursor.execute(f"""
                SELECT setval(
                    pg_get_serial_sequence('{table}', 'id'),
                    COALESCE((SELECT MAX(id) FROM {table}), 1),
                    EXISTS (SELECT 1 FROM {table})
                );
            """)

        conn.commit()
        print("Database initial seeding and sequence synchronization completed successfully!")

        cursor.close()
        conn.close()

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error seeding database: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    seed_database()