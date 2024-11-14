const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    employeeType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeType',
        required: true
    },
    status: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Status',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Performance', performanceSchema);