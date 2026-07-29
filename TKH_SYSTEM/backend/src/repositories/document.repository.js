const { getPool, sql } = require("../config/database");

const DOCUMENT_SELECT = `
  SELECT
    d.id,
    d.season_id,
    d.title,
    d.description,
    d.file_url,
    d.file_type,
    d.display_order,
    d.is_published,
    d.created_by_user_id,
    d.created_at,
    d.updated_at,

    creator.username AS creator_username

  FROM dbo.documents AS d

  LEFT JOIN dbo.users AS creator
    ON creator.id = d.created_by_user_id
`;

async function findDocumentById(documentId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("documentId", sql.Int, documentId)
    .query(`
      ${DOCUMENT_SELECT}

      WHERE d.id = @documentId;
    `);

  return result.recordset[0] || null;
}

async function findPublishedDocumentsBySeasonId(
  seasonId
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      ${DOCUMENT_SELECT}

      WHERE
        d.season_id = @seasonId
        AND d.is_published = 1

      ORDER BY
        d.display_order ASC,
        d.created_at DESC,
        d.id DESC;
    `);

  return result.recordset;
}

async function findDocumentsBySeasonId(seasonId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .query(`
      ${DOCUMENT_SELECT}

      WHERE d.season_id = @seasonId

      ORDER BY
        d.display_order ASC,
        d.created_at DESC,
        d.id DESC;
    `);

  return result.recordset;
}

async function createDocument({
  seasonId,
  title,
  description,
  fileUrl,
  fileType,
  displayOrder,
  isPublished,
  createdByUserId,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("seasonId", sql.Int, seasonId)
    .input(
      "title",
      sql.NVarChar(400),
      title
    )
    .input(
      "description",
      sql.NVarChar(2000),
      description
    )
    .input(
      "fileUrl",
      sql.NVarChar(2000),
      fileUrl
    )
    .input(
      "fileType",
      sql.VarChar(30),
      fileType
    )
    .input(
      "displayOrder",
      sql.Int,
      displayOrder
    )
    .input(
      "isPublished",
      sql.Bit,
      isPublished
    )
    .input(
      "createdByUserId",
      sql.Int,
      createdByUserId
    )
    .query(`
      INSERT INTO dbo.documents
      (
        season_id,
        title,
        description,
        file_url,
        file_type,
        display_order,
        is_published,
        created_by_user_id
      )
      OUTPUT
        INSERTED.id
      VALUES
      (
        @seasonId,
        @title,
        @description,
        @fileUrl,
        @fileType,
        @displayOrder,
        @isPublished,
        @createdByUserId
      );
    `);

  const createdDocumentId =
    result.recordset[0].id;

  return findDocumentById(createdDocumentId);
}

async function updateDocument({
  documentId,
  title,
  description,
  fileUrl,
  fileType,
  displayOrder,
  isPublished,
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "documentId",
      sql.Int,
      documentId
    )
    .input(
      "title",
      sql.NVarChar(400),
      title
    )
    .input(
      "description",
      sql.NVarChar(2000),
      description
    )
    .input(
      "fileUrl",
      sql.NVarChar(2000),
      fileUrl
    )
    .input(
      "fileType",
      sql.VarChar(30),
      fileType
    )
    .input(
      "displayOrder",
      sql.Int,
      displayOrder
    )
    .input(
      "isPublished",
      sql.Bit,
      isPublished
    )
    .query(`
      UPDATE dbo.documents
      SET
        title = @title,
        description = @description,
        file_url = @fileUrl,
        file_type = @fileType,
        display_order = @displayOrder,
        is_published = @isPublished,
        updated_at = SYSDATETIME()
      WHERE id = @documentId;

      SELECT @@ROWCOUNT AS affected_rows;
    `);

  const affectedRows =
    Number(
      result.recordset[0]?.affected_rows
    ) || 0;

  if (affectedRows === 0) {
    return null;
  }

  return findDocumentById(documentId);
}

async function deleteDocument(documentId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "documentId",
      sql.Int,
      documentId
    )
    .query(`
      DELETE FROM dbo.documents
      WHERE id = @documentId;

      SELECT @@ROWCOUNT AS affected_rows;
    `);

  const affectedRows =
    Number(
      result.recordset[0]?.affected_rows
    ) || 0;

  return affectedRows > 0;
}

module.exports = {
  findDocumentById,
  findPublishedDocumentsBySeasonId,
  findDocumentsBySeasonId,
  createDocument,
  updateDocument,
  deleteDocument,
};