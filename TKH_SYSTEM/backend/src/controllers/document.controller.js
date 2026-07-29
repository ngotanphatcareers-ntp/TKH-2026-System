const {
  getPublishedDocuments,
  getAdminDocuments,
  addDocument,
  editDocument,
  removeDocument,
} = require("../services/document.service");

async function getDocumentsController(req, res) {
  try {
    const result = await getPublishedDocuments();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get published documents error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

async function getAdminDocumentsController(req, res) {
  try {
    const result = await getAdminDocuments();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get admin documents error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

async function createDocumentController(req, res) {
  try {
    const result = await addDocument({
      title: req.body.title,
      description: req.body.description,
      fileUrl: req.body.fileUrl,
      fileType: req.body.fileType,
      displayOrder: req.body.displayOrder,
      isPublished: req.body.isPublished,
      createdByUserId: req.user.id,
    });

    if (!result.success) {
      const statusByCode = {
        DOCUMENT_TITLE_REQUIRED: 400,
        DOCUMENT_TITLE_TOO_LONG: 400,
        DOCUMENT_DESCRIPTION_TOO_LONG: 400,
        DOCUMENT_FILE_URL_REQUIRED: 400,
        DOCUMENT_FILE_URL_TOO_LONG: 400,
        DOCUMENT_FILE_TYPE_TOO_LONG: 400,
        INVALID_DISPLAY_ORDER: 400,
        INVALID_CREATED_BY_USER_ID: 400,
        ACTIVE_SEASON_NOT_FOUND: 404,
      };

      return res
        .status(statusByCode[result.code] || 400)
        .json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error(
      "Create document error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

async function updateDocumentController(req, res) {
  try {
    const result = await editDocument({
      documentId: req.params.documentId,
      title: req.body.title,
      description: req.body.description,
      fileUrl: req.body.fileUrl,
      fileType: req.body.fileType,
      displayOrder: req.body.displayOrder,
      isPublished: req.body.isPublished,
    });

    if (!result.success) {
      const statusByCode = {
        INVALID_DOCUMENT_ID: 400,
        DOCUMENT_TITLE_REQUIRED: 400,
        DOCUMENT_TITLE_TOO_LONG: 400,
        DOCUMENT_DESCRIPTION_TOO_LONG: 400,
        DOCUMENT_FILE_URL_REQUIRED: 400,
        DOCUMENT_FILE_URL_TOO_LONG: 400,
        DOCUMENT_FILE_TYPE_TOO_LONG: 400,
        INVALID_DISPLAY_ORDER: 400,
        DOCUMENT_NOT_FOUND: 404,
      };

      return res
        .status(statusByCode[result.code] || 400)
        .json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Update document error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

async function deleteDocumentController(req, res) {
  try {
    const result = await removeDocument({
      documentId: req.params.documentId,
    });

    if (!result.success) {
      const statusByCode = {
        INVALID_DOCUMENT_ID: 400,
        DOCUMENT_NOT_FOUND: 404,
      };

      return res
        .status(statusByCode[result.code] || 400)
        .json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Delete document error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

module.exports = {
  getDocuments: getDocumentsController,
  getAdminDocuments: getAdminDocumentsController,
  createDocument: createDocumentController,
  updateDocument: updateDocumentController,
  deleteDocument: deleteDocumentController,
};