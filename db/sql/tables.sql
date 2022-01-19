CREATE TABLE IF NOT EXISTS roles(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS subsystems(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS users(
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    role_id INTEGER REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS access_rights(
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id),
    subsystem_id INTEGER REFERENCES subsystems(id),
    write_access BOOLEAN
);
