const mongoose = require("mongoose");

const OrgPayslipInfoSchemas = {};

function getPayslipInfoSchema(orgName) {
    if (!OrgPayslipInfoSchemas[orgName]) {
        OrgPayslipInfoSchemas[orgName] = new mongoose.Schema({
            payslipFields: { type: mongoose.Schema.Types.Mixed, default: {} },
        }, { minimize: false })
    }
    return OrgPayslipInfoSchemas[orgName];
}

const OrgPayslipInfoModels = {};

function getPayslipInfoModel(orgName) {
    if (!OrgPayslipInfoModels[orgName]) {
        OrgPayslipInfoModels[orgName] = mongoose.model(`${orgName}_PayslipInfo`, getPayslipInfoSchema(orgName));
    }
    return OrgPayslipInfoModels[orgName];
}

module.exports = {getPayslipInfoModel}
