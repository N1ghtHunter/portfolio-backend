const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    image_path: {
        type: String,
    },
    source_code: {
        type: String,
    },
    live_demo: {
        type: String,
    },
});

const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
