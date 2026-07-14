CREATE DATABASE TKH_SYSTEM;
GO

USE TKH_SYSTEM;
GO

CREATE TABLE groups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    group_name NVARCHAR(100) NOT NULL,
    logo_url NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(150) NOT NULL,
    nickname NVARCHAR(100),
    gender NVARCHAR(20),
    group_id INT,
    role NVARCHAR(30) NOT NULL DEFAULT 'student',
    is_first_login BIT DEFAULT 1,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_users_groups
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE sessions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_name NVARCHAR(100) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    attendance_status NVARCHAR(30) DEFAULT 'Closed',
    random_status NVARCHAR(30) DEFAULT 'Closed',
    session_status NVARCHAR(30) DEFAULT 'Active',
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE schedules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL,
    title NVARCHAR(150) NOT NULL,
    bible_verse NVARCHAR(150),
    activity NVARCHAR(255),
    speaker NVARCHAR(150),
    note NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_schedules_sessions
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE attendance_records (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    checkin_time DATETIME DEFAULT GETDATE(),
    latitude DECIMAL(18,15),
    longitude DECIMAL(18,15),
    distance_meters DECIMAL(10,2),
    gps_accuracy_meters DECIMAL(10,2),
    status NVARCHAR(30) NOT NULL,
    note NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_attendance_users
    FOREIGN KEY (user_id) REFERENCES users(id),

    CONSTRAINT FK_attendance_sessions
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE scores (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT,
    score_value INT NOT NULL,
    score_type NVARCHAR(50) NOT NULL,
    reason NVARCHAR(255),
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_scores_users
    FOREIGN KEY (user_id) REFERENCES users(id),

    CONSTRAINT FK_scores_sessions
    FOREIGN KEY (session_id) REFERENCES sessions(id),

    CONSTRAINT FK_scores_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE settings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    setting_key NVARCHAR(100) NOT NULL UNIQUE,
    setting_value NVARCHAR(255) NOT NULL,
    description NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);