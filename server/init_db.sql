-- init_db.sql
-- This script will run on first container startup (via docker-entrypoint-initdb.d)

DO
$do$
BEGIN
   -- Create role and database if not exists
   PERFORM 1 FROM pg_roles WHERE rolname = 'kse_user';
   IF NOT FOUND THEN
       CREATE ROLE kse_user WITH LOGIN PASSWORD 'your_db_password';
   END IF;
   PERFORM 1 FROM pg_database WHERE datname = 'kse_smart_watt';
   IF NOT FOUND THEN
       CREATE DATABASE kse_smart_watt OWNER kse_user;
   END IF;
END
$do$;

GRANT ALL PRIVILEGES ON DATABASE kse_smart_watt TO kse_user;
