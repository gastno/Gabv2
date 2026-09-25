import psycopg2
import sys

# Database Configuration matching docker-compose.yml
DB_CONFIG = {
    "dbname": "appointment_db",
    "user": "db_user",
    "password": "db_password_123",
    "host": "localhost",
    "port": "5432"
}

def seed_database():
    try:
        print("Connecting to PostgreSQL container...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        print("Connection successful! Inserting initial data...")

        # 1. Insert System Roles
        cursor.execute("""
            INSERT INTO roles (id, name, description) VALUES 
                (1, 'super_admin', 'Full system access'),
                (2, 'admin', 'Brand administrator access'),
                (3, 'staff', 'Specialist staff account')
            ON CONFLICT (name) DO NOTHING;
        """)

        # 2. Insert Default Brand with slug
        cursor.execute("""
            INSERT INTO brands (id, name, slug, location, about_description) VALUES
                (1, 'Gabbablu', 'gabbablu', 'Reykjavík, Iceland', 'Premier lash and brow specialist salon'),
                (2, 'Amor Tattoo', 'amor-tattoo', 'Reykjavík, Iceland', 'Tattoo and piercing studio')
            ON CONFLICT (id) DO NOTHING;
        """)

        # 3. Insert Initial Categories
        #cursor.execute("""
        #    INSERT INTO categories (id, brand_id, name, description) VALUES
        #        (1, 1, 'Combos', 'Combined treatments and packages'),
        #        (2, 1, 'Lashes Extension', 'Professional eyelash extensions'),
        #        (3, 1, 'Eyebrows', 'Brow shaping, tinting and lamination')
        #    ON CONFLICT (id) DO NOTHING;
        #""")
        

        # 4. Insert Initial Specialist Staff
        cursor.execute("""
            INSERT INTO staff (id, role_id, username, password_hash, full_name, description) VALUES
                (1, 2, 'gabbablu', '$2b$10$1IUDHUtOhELtoGJF44RFZug4ZT7DuxSuoX/uxgwEIbHaf50y978ne', 'Gabbablu Admin', 'Brand Administrator')
            ON CONFLICT (username) DO NOTHING;
        """)

        # 5. Assign Staff to Brand
        cursor.execute("""
            INSERT INTO staff_brands (staff_id, brand_id) VALUES (1, 1)
            ON CONFLICT DO NOTHING;
        """)

        # Commit transaction
        conn.commit()
        print("Database initial seeding completed successfully!")

        # Verify created tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        tables = cursor.fetchall()
        print("\nCreated Tables in Database:")
        for t in tables:
            print(f" - {t[0]}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error seeding database: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    seed_database()