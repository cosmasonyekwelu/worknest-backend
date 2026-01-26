import * as applicationService from "../services/application.service.js";
import ResponseHandler from "../lib/responseHandler.js";

/**
 * Submit application
 */
export const submitApplication = async (req, res, next) => {
  try {
    // Validate jobId
    if (!req.body.jobId) {
      throw ResponseHandler.errorResponse("jobId is required", 400);
    }

    // Validate resume file
    if (!req.files?.resume?.[0]) {
      throw ResponseHandler.errorResponse("Resume is required", 400);
    }

    // Parse answers safely
    let answers = [];
    if (req.body.answers) {
      try {
        answers = JSON.parse(req.body.answers);
        if (!Array.isArray(answers)) {
          throw new Error();
        }
      } catch {
        throw ResponseHandler.errorResponse("Invalid answers format", 400);
      }
    }

    const application = await applicationService.submitApplication({
      userId: req.user.id,
      jobId: req.body.jobId,
      resumeFile: req.files.resume[0],
      portfolioUrl: req.body.portfolioUrl || null,
      linkedinUrl: req.body.linkedinUrl || null,
      answers,
    });

    return ResponseHandler.successResponse(
      res,
      { id: application.id, status: application.status },
      "Application submitted successfully",
      201,
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user's applications
 */
export const getMyApplications = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      throw ResponseHandler.errorResponse("Invalid pagination values", 400);
    }

    const result = await applicationService.getMyApplications(
      req.user.id,
      page,
      limit,
    );

    return ResponseHandler.successResponse(
      res,
      result,
      "Applications fetched successfully",
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Get application by ID
 */
export const getApplicationById = async (req, res, next) => {
  try {
    if (!req.params.id) {
      throw ResponseHandler.errorResponse("Application ID is required", 400);
    }

    const application = await applicationService.getApplicationById(
      req.user.id,
      req.params.id,
    );

    return ResponseHandler.successResponse(
      res,
      application,
      "Application fetched successfully",
    );
  } catch (err) {
    next(err);
  }
};
