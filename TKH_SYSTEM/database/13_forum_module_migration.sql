SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    /*
    =====================================================
    Forum Rooms
    =====================================================
    */

    IF OBJECT_ID(
        N'dbo.forum_rooms',
        N'U'
    ) IS NULL
    BEGIN
        CREATE TABLE dbo.forum_rooms
        (
            id INT IDENTITY(1,1) NOT NULL,

            name NVARCHAR(100) NOT NULL,

            room_type VARCHAR(20) NOT NULL
                CONSTRAINT DF_forum_rooms_room_type
                DEFAULT ('CUSTOM'),

            password_hash NVARCHAR(255) NULL,

            created_by_user_id INT NULL,

            is_active BIT NOT NULL
                CONSTRAINT DF_forum_rooms_is_active
                DEFAULT (1),

            created_at DATETIME2(0) NOT NULL
                CONSTRAINT DF_forum_rooms_created_at
                DEFAULT (GETDATE()),

            updated_at DATETIME2(0) NOT NULL
                CONSTRAINT DF_forum_rooms_updated_at
                DEFAULT (GETDATE()),

            CONSTRAINT PK_forum_rooms
                PRIMARY KEY CLUSTERED (id),

            CONSTRAINT CK_forum_rooms_room_type
                CHECK (
                    room_type IN (
                        'GLOBAL',
                        'CUSTOM'
                    )
                ),

            CONSTRAINT FK_forum_rooms_created_by_user
                FOREIGN KEY (created_by_user_id)
                REFERENCES dbo.users(id)
        );
    END;


    /*
    =====================================================
    Forum Messages
    =====================================================
    */

    IF OBJECT_ID(
        N'dbo.forum_messages',
        N'U'
    ) IS NULL
    BEGIN
        CREATE TABLE dbo.forum_messages
        (
            id BIGINT IDENTITY(1,1) NOT NULL,

            room_id INT NOT NULL,

            sender_user_id INT NOT NULL,

            message_text NVARCHAR(1000) NOT NULL,

            created_at DATETIME2(0) NOT NULL
                CONSTRAINT DF_forum_messages_created_at
                DEFAULT (GETDATE()),

            CONSTRAINT PK_forum_messages
                PRIMARY KEY CLUSTERED (id),

            CONSTRAINT FK_forum_messages_room
                FOREIGN KEY (room_id)
                REFERENCES dbo.forum_rooms(id),

            CONSTRAINT FK_forum_messages_sender_user
                FOREIGN KEY (sender_user_id)
                REFERENCES dbo.users(id)
        );
    END;


    /*
    =====================================================
    Indexes
    =====================================================
    */

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE
            name =
                N'IX_forum_rooms_active_created_at'
            AND object_id =
                OBJECT_ID(
                    N'dbo.forum_rooms'
                )
    )
    BEGIN
        CREATE NONCLUSTERED INDEX
            IX_forum_rooms_active_created_at

        ON dbo.forum_rooms
        (
            is_active,
            created_at DESC
        )

        INCLUDE
        (
            name,
            room_type,
            created_by_user_id
        );
    END;


    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE
            name =
                N'IX_forum_messages_room_created_at'
            AND object_id =
                OBJECT_ID(
                    N'dbo.forum_messages'
                )
    )
    BEGIN
        CREATE NONCLUSTERED INDEX
            IX_forum_messages_room_created_at

        ON dbo.forum_messages
        (
            room_id,
            created_at DESC,
            id DESC
        )

        INCLUDE
        (
            sender_user_id,
            message_text
        );
    END;


    /*
    =====================================================
    Global Chat Room
    =====================================================
    */

    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.forum_rooms
        WHERE room_type = 'GLOBAL'
    )
    BEGIN
        INSERT INTO dbo.forum_rooms
        (
            name,
            room_type,
            password_hash,
            created_by_user_id,
            is_active
        )
        VALUES
        (
            N'Chat tổng',
            'GLOBAL',
            NULL,
            NULL,
            1
        );
    END;


    COMMIT TRANSACTION;

    SELECT
        N'Forum module migration completed successfully.'
            AS message;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;