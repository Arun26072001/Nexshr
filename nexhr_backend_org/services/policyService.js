const { CompanyPolicy } = require('../models/CompanyPolicyModel');

// In-memory cache for policies (could be replaced with Redis in production)
const policyCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of policyCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      policyCache.delete(key);
    }
  }
}, CACHE_TTL);

async function getCompanyPolicy(companyId, useCache = true) {
  if (!companyId) throw new Error('Company ID is required');

  const cacheKey = `policy_${companyId}`;

  if (useCache && policyCache.has(cacheKey)) {
    const cached = policyCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    } else {
      policyCache.delete(cacheKey);
    }
  }

  try {
    let policy = await CompanyPolicy.findOne({ company: companyId }).lean();

    if (!policy) {
      const defaultPolicy = new CompanyPolicy({ company: companyId });
      policy = await defaultPolicy.save();
      policy = policy.toObject();
    }

    if (useCache) {
      policyCache.set(cacheKey, { data: policy, timestamp: Date.now() });
    }

    return policy;
  } catch (error) {
    console.error('Error fetching company policy:', error);
    throw error;
  }
}

async function getPolicySection(companyId, section) {
  const policy = await getCompanyPolicy(companyId);
  return policy[section] || {};
}

async function getAttendancePolicy(companyId) {
  return getPolicySection(companyId, 'attendance');
}

async function getLeavePolicy(companyId) {
  return getPolicySection(companyId, 'leave');
}

async function getPayrollPolicy(companyId) {
  return getPolicySection(companyId, 'payroll');
}

async function getNotificationPolicy(companyId) {
  return getPolicySection(companyId, 'notifications');
}

async function getApprovalPolicy(companyId) {
  return getPolicySection(companyId, 'approval');
}

async function getSystemPolicy(companyId) {
  return getPolicySection(companyId, 'system');
}

async function getPolicyValue(companyId, path, defaultValue = null) {
  try {
    const policy = await getCompanyPolicy(companyId);
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
  } catch (error) {
    console.error(`Error getting policy value for path ${path}:`, error);
    return defaultValue;
  }
}

function clearCache(companyId) {
  if (companyId) {
    policyCache.delete(`policy_${companyId}`);
  } else {
    policyCache.clear();
  }
}

function getCacheStats() {
  return {
    size: policyCache.size,
    keys: Array.from(policyCache.keys()),
    ttl: CACHE_TTL,
  };
}

function validatePolicyUpdates(updates) {
  const warnings = [];
  const errors = [];

  if (updates.attendance?.monthlyPermissionLimit > 5) {
    warnings.push('High monthly permission limit may affect productivity');
  }

  if (updates.attendance?.warningLimit < 2) {
    warnings.push('Low warning limit may be too strict');
  }

  if (updates.leave?.teamLeaveLimit > 3) {
    warnings.push('High team leave limit may affect operations');
  }

  return { warnings, errors, isValid: errors.length === 0 };
}

module.exports = {
  getCompanyPolicy,
  getPolicySection,
  getAttendancePolicy,
  getLeavePolicy,
  getPayrollPolicy,
  getNotificationPolicy,
  getApprovalPolicy,
  getSystemPolicy,
  getPolicyValue,
  clearCache,
  getCacheStats,
  validatePolicyUpdates
};
