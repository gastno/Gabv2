import os
import psycopg2
import sys
import bcrypt

def required_environment(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise ValueError(f"{name} must be set before seeding.")
    return value

def seed_database():
    conn = None
    try:
        db_config = {
            "dbname": required_environment("DB_NAME"),
            "user": required_environment("DB_USER"),
            "password": required_environment("DB_PASSWORD"),
            "host": required_environment("DB_HOST"),
            "port": os.environ.get("DB_PORT", "5432"),
        }
        admin_username = required_environment("ADMIN_USERNAME")
        admin_password = required_environment("ADMIN_PASSWORD")
        if len(admin_password) < 12:
            raise ValueError("ADMIN_PASSWORD must be at least 12 characters.")
        password_hash = bcrypt.hashpw(
            admin_password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        print("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(**db_config)
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
            INSERT INTO brands (id, name, slug, location, about_description, description_en) VALUES
                (1, 'Gabbablu', 'gabbablu', 'Reykjavík, Iceland',
                    'Premier lash and brow specialist salon', 'Premier lash and brow specialist salon'),
                (2, 'Amor Tattoo', 'amor-tattoo', 'Reykjavík, Iceland',
                    'Tattoo and piercing studio', 'Tattoo and piercing studio')
            ON CONFLICT (id) DO NOTHING;
        """)

        # 3. Initial Staff Seeding
        cursor.execute("""
            INSERT INTO staff (id, role_id, username, password_hash, full_name, description_en)
            VALUES (1, 2, %s, %s, 'Gabbablu Admin', 'Brand Administrator')
            ON CONFLICT (username) DO NOTHING;
        """, (admin_username, password_hash))

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