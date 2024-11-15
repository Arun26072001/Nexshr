const mongoose = require("mongoose");

const OrgPayslipSchemas = {};

function getPayslipSchema(orgName) {
    if (!OrgPayslipSchemas[orgName]) {
        OrgPayslipSchemas[orgName] = new mongoose.Schema({
            employee: { type: mongoose.Schema.Types.ObjectId, ref: `${orgName}Employee` },
            payslip: {
                type: mongoose.Schema.Types.Mixed, default: {}
            }
        }, { minimize: false })
    }
    return OrgPayslipSchemas[orgName];
}

const OrgPayslipModels = {};

function getPayslipModel(orgName) {
    if (!OrgPayslipModels[orgName]) {
        OrgPayslipModels[orgName] = mongoose.model(`${orgName}Payslip`, getPayslipSchema(orgName));
    }
    return OrgPayslipModels[orgName];
}

module.exports = { getPayslipModel }