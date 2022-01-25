CREATE TABLE IF NOT EXISTS roles_enum(
    role_id         SERIAL PRIMARY KEY,
    role_name       VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS views_enum(
    view_id         SERIAL PRIMARY KEY,
    view_name       VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS employees(
    emp_id          VARCHAR(255) PRIMARY KEY,
    emp_name        VARCHAR(255) NOT NULL,
    username        VARCHAR(255) NOT NULL,
    password        VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    contact_number  VARCHAR(255),
    nok_name        VARCHAR(255),
    nok_number      VARCHAR(255),
    address         VARCHAR(255),
    postal_code     VARCHAR(255),
    discharge_date  TIMESTAMPTZ,
    role_id         INTEGER REFERENCES roles_enum(role_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_rights(
    ar_id           SERIAL PRIMARY KEY,
    emp_id          VARCHAR(255) REFERENCES employees(emp_id),
    view_id         INTEGER REFERENCES views_enum(view_id),
    write_access    BOOLEAN
);

CREATE TABLE IF NOT EXISTS charged_under_enum(
    cu_id           SERIAL PRIMARY KEY,
    cu_name         VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS customers(
    cus_id          VARCHAR(255) PRIMARY KEY,
    company_name    VARCHAR(255) NOT NULL,
    company_email   VARCHAR(255),
    p1_name         VARCHAR(255) NOT NULL,
    p1_phone_number VARCHAR(255) NOT NULL,
    p2_name         VARCHAR(255),
    p2_phone_number VARCHAR(255),
    address         VARCHAR(255) NOT NULL,
    postal_code     VARCHAR(255) NOT NULL,
    cu_id           INTEGER references charged_under_enum(cu_id) NOT NULL,
    gst             BOOLEAN NOT NULL,
    gst_show        BOOLEAN NOT NULL,
    description     VARCHAR(255),
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
