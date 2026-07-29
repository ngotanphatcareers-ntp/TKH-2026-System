const {
  findDocumentById,
  findPublishedDocumentsBySeasonId,
  findDocumentsBySeasonId,
  createDocument,
  updateDocument,
  deleteDocument,
} = require("../repositories/document.repository");

const {
  findActiveSeason,
} = require("../repositories/season.repository");

function mapDocument(document) {
  if (!document) {
    return null;
  }

  return {
    id: document.id,
    title: document.title,
    description: document.description,
    fileUrl: document.file_url,
    fileType: document.file_type,
    displayOrder: document.display_order,
    isPublished: Boolean(document.is_published),
    createdAt: document.created_at,
    updatedAt: document.updated_at,

    creator: document.created_by_user_id
      ? {
          id: document.created_by_user_id,
          username: document.creator_username,
        }
      : null,
  };
}

function normalizeBoolean(value, defaultValue = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === 1 || value === "1") {
    return true;
  }

  if (value === 0 || value === "0") {
    return false;
  }

  if (typeof value === "string") {
    const normalizedValue = value
      .trim()
      .toLowerCase();

    if (normalizedValue === "true") {
      return true;
    }

    if (normalizedValue === "false") {
      return false;
    }
  }

  return defaultValue;
}

async function getPublishedDocuments() {
  const activeSeason = await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const documents =
    await findPublishedDocumentsBySeasonId(
      activeSeason.id
    );

  return {
    success: true,
    documents: documents.map(mapDocument),
  };
}

async function getAdminDocuments() {
  const activeSeason = await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const documents =
    await findDocumentsBySeasonId(
      activeSeason.id
    );

  return {
    success: true,
    documents: documents.map(mapDocument),
  };
}

async function addDocument({
  title,
  description,
  fileUrl,
  fileType,
  displayOrder,
  isPublished,
  createdByUserId,
}) {
  const normalizedTitle = String(
    title || ""
  ).trim();

  if (!normalizedTitle) {
    return {
      success: false,
      code: "DOCUMENT_TITLE_REQUIRED",
    };
  }

  if (normalizedTitle.length > 400) {
    return {
      success: false,
      code: "DOCUMENT_TITLE_TOO_LONG",
    };
  }

  const normalizedDescription = String(
    description || ""
  ).trim();

  if (normalizedDescription.length > 2000) {
    return {
      success: false,
      code: "DOCUMENT_DESCRIPTION_TOO_LONG",
    };
  }

  const normalizedFileUrl = String(
    fileUrl || ""
  ).trim();

  if (!normalizedFileUrl) {
    return {
      success: false,
      code: "DOCUMENT_FILE_URL_REQUIRED",
    };
  }

  if (normalizedFileUrl.length > 2000) {
    return {
      success: false,
      code: "DOCUMENT_FILE_URL_TOO_LONG",
    };
  }

  const normalizedFileType = String(
    fileType || ""
  )
    .trim()
    .toUpperCase();

  if (normalizedFileType.length > 30) {
    return {
      success: false,
      code: "DOCUMENT_FILE_TYPE_TOO_LONG",
    };
  }

  const normalizedDisplayOrder =
    displayOrder === undefined ||
    displayOrder === null ||
    displayOrder === ""
      ? 0
      : Number(displayOrder);

  if (
    !Number.isInteger(normalizedDisplayOrder) ||
    normalizedDisplayOrder < 0
  ) {
    return {
      success: false,
      code: "INVALID_DISPLAY_ORDER",
    };
  }

  const normalizedCreatedByUserId =
    Number(createdByUserId);

  if (
    !Number.isInteger(
      normalizedCreatedByUserId
    ) ||
    normalizedCreatedByUserId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_CREATED_BY_USER_ID",
    };
  }

  const activeSeason = await findActiveSeason();

  if (!activeSeason) {
    return {
      success: false,
      code: "ACTIVE_SEASON_NOT_FOUND",
    };
  }

  const createdDocument = await createDocument({
    seasonId: activeSeason.id,
    title: normalizedTitle,
    description:
      normalizedDescription || null,
    fileUrl: normalizedFileUrl,
    fileType:
      normalizedFileType || null,
    displayOrder:
      normalizedDisplayOrder,
    isPublished: normalizeBoolean(
      isPublished,
      true
    ),
    createdByUserId:
      normalizedCreatedByUserId,
  });

  return {
    success: true,
    document: mapDocument(createdDocument),
  };
}

async function editDocument({
  documentId,
  title,
  description,
  fileUrl,
  fileType,
  displayOrder,
  isPublished,
}) {
  const normalizedDocumentId =
    Number(documentId);

  if (
    !Number.isInteger(normalizedDocumentId) ||
    normalizedDocumentId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_DOCUMENT_ID",
    };
  }

  const existingDocument =
    await findDocumentById(
      normalizedDocumentId
    );

  if (!existingDocument) {
    return {
      success: false,
      code: "DOCUMENT_NOT_FOUND",
    };
  }

  const normalizedTitle = String(
    title || ""
  ).trim();

  if (!normalizedTitle) {
    return {
      success: false,
      code: "DOCUMENT_TITLE_REQUIRED",
    };
  }

  if (normalizedTitle.length > 400) {
    return {
      success: false,
      code: "DOCUMENT_TITLE_TOO_LONG",
    };
  }

  const normalizedDescription = String(
    description || ""
  ).trim();

  if (normalizedDescription.length > 2000) {
    return {
      success: false,
      code: "DOCUMENT_DESCRIPTION_TOO_LONG",
    };
  }

  const normalizedFileUrl = String(
    fileUrl || ""
  ).trim();

  if (!normalizedFileUrl) {
    return {
      success: false,
      code: "DOCUMENT_FILE_URL_REQUIRED",
    };
  }

  if (normalizedFileUrl.length > 2000) {
    return {
      success: false,
      code: "DOCUMENT_FILE_URL_TOO_LONG",
    };
  }

  const normalizedFileType = String(
    fileType || ""
  )
    .trim()
    .toUpperCase();

  if (normalizedFileType.length > 30) {
    return {
      success: false,
      code: "DOCUMENT_FILE_TYPE_TOO_LONG",
    };
  }

  const normalizedDisplayOrder =
    Number(displayOrder);

  if (
    !Number.isInteger(normalizedDisplayOrder) ||
    normalizedDisplayOrder < 0
  ) {
    return {
      success: false,
      code: "INVALID_DISPLAY_ORDER",
    };
  }

  const updatedDocument = await updateDocument({
    documentId: normalizedDocumentId,
    title: normalizedTitle,
    description:
      normalizedDescription || null,
    fileUrl: normalizedFileUrl,
    fileType:
      normalizedFileType || null,
    displayOrder:
      normalizedDisplayOrder,
    isPublished: normalizeBoolean(
      isPublished,
      Boolean(existingDocument.is_published)
    ),
  });

  if (!updatedDocument) {
    return {
      success: false,
      code: "DOCUMENT_NOT_FOUND",
    };
  }

  return {
    success: true,
    document: mapDocument(updatedDocument),
  };
}

async function removeDocument({
  documentId,
}) {
  const normalizedDocumentId =
    Number(documentId);

  if (
    !Number.isInteger(normalizedDocumentId) ||
    normalizedDocumentId <= 0
  ) {
    return {
      success: false,
      code: "INVALID_DOCUMENT_ID",
    };
  }

  const existingDocument =
    await findDocumentById(
      normalizedDocumentId
    );

  if (!existingDocument) {
    return {
      success: false,
      code: "DOCUMENT_NOT_FOUND",
    };
  }

  const deleted = await deleteDocument(
    normalizedDocumentId
  );

  if (!deleted) {
    return {
      success: false,
      code: "DOCUMENT_NOT_FOUND",
    };
  }

  return {
    success: true,
  };
}

module.exports = {
  getPublishedDocuments,
  getAdminDocuments,
  addDocument,
  editDocument,
  removeDocument,
};