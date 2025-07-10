const pkg = require('mongoose');
const { Schema, model, models } = pkg;

const GlossarySchema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        category: { type: String, default: '' },
    },
    { timestamps: true },
);

const GlossaryModel = models.Glossary || model('Glossary', GlossarySchema);
module.exports = GlossaryModel;
