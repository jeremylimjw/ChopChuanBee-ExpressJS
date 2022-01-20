CREATE TABLE IF NOT EXISTS roles(
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS views(
    view_id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS users(
    user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    role_id INTEGER REFERENCES roles(role_id)
);

CREATE TABLE IF NOT EXISTS access_rights(
    access_right_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id),
    view_id INTEGER REFERENCES views(view_id),
    write_access BOOLEAN
);
