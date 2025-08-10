const PolicyService = require('../services/policyService');
const { getCompanyIdFromToken } = require('../Reuseable_functions/reusableFunction');

/**
 * Middleware to set employee policy defaults during employee creation/update
 */
const setEmployeePolicyDefaults = async (req, res, next) => {
  try {
    // Get company ID from token or request body
    let companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId && req.body.company) {
      companyId = req.body.company;
    }

    if (!companyId) {
      return next(); // Continue without setting defaults if no company
    }

    // Get attendance policy
    const attendancePolicy = await PolicyService.getAttendancePolicy(companyId);
    const leavePolicy = await PolicyService.getLeavePolicy(companyId);

    // Set defaults in request body if not provided
    if (req.body.monthlyPermissions === undefined) {
      req.body.monthlyPermissions = attendancePolicy.monthlyPermissionLimit || 2;
    }

    if (req.body.warnings === undefined) {
      req.body.warnings = attendancePolicy.warningLimit || 3;
    }

    if (req.body.permissionHour === undefined) {
      req.body.permissionHour = attendancePolicy.permissionHourLimit || 120;
    }

    if (req.body.annualLeaveEntitlement === undefined) {
      req.body.annualLeaveEntitlement = leavePolicy.annualLeaveDefault || 14;
    }

    next();
  } catch (error) {
    console.error('Error in policy middleware:', error);
    next(); // Continue even if policy loading fails
  }
};

/**
 * Middleware to inject company policy into request for easy access
 */
const injectCompanyPolicy = async (req, res, next) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (companyId) {
      req.companyPolicy = await PolicyService.getCompanyPolicy(companyId);
    }
    next();
  } catch (error) {
    console.error('Error injecting company policy:', error);
    next(); // Continue even if policy loading fails
  }
};

/**
 * Helper function to get policy value with fallback
 */
const getPolicyValue = (policy, path, defaultValue) => {
  const pathParts = path.split('.');
  let value = policy;
  
  for (const part of pathParts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return defaultValue;
    }
  }
  
  return value !== undefined ? value : defaultValue;
};

module.exports = {
  setEmployeePolicyDefaults,
  injectCompanyPolicy,
  getPolicyValue
};
