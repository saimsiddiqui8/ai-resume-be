const { z } = require('zod');

const PaginationValidator = z
    .object({
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).optional().default(10),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        search: z.string().optional().or(z.literal('')),
    })
    .passthrough(); // allows extra/unknown keys

module.exports = {
    PaginationValidator,
};
