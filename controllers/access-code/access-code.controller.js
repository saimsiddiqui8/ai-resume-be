import AccessCode from "../../models/access-code/access-code.model.js";
import User from "../../models/user-model/user.model.js";
import { generateRandomAccessCode } from "../../utils/auth/generate-access-code.js";
import { accessCodeSchema, verifyAccessCodeSchema } from "../../validators/access-code-validations.js";


const generateAccessCode = async (req, res) => {
    try {
      const newCode = generateRandomAccessCode();
  
      // Always create a new access code entry
      const accessCodeRecord = await AccessCode.create({ code: newCode });
  
      return res.status(200).json({
        success: true,
        message: "Access code generated!",
        data: { code: accessCodeRecord.code },
      });
    } catch (error) {
      console.error("Error generating access code:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  const getAllAccessCodes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [accessCodes, totalCount] = await Promise.all([
      AccessCode.find()
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .lean(),
      AccessCode.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        accessCodes,
          totalCount,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Error fetching access codes:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
  

const verifyAccessCode = async (req, res) => {
    try {
        // Validate request body using Joi
        const { error, value } = verifyAccessCodeSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { code } = value;
        const user = req.user.id;
        
        // Check if the code exists
        const accessCodeRecord = await AccessCode.findOne({ code });

        if (!accessCodeRecord) {
            return res.status(400).json({
                success: false,
                message: "Access code is invalid.",
            });
        }

        if (accessCodeRecord.is_used) {
            return res.status(400).json({
                success: false,
                message: "Access code has already been used.",
            });
        }

        accessCodeRecord.is_used = true;
        await accessCodeRecord.save();

        await User.findByIdAndUpdate(user, {is_subscription_paid: true, current_subscription_plan : "access-code"})

        return res.status(200).json({
            success: true,
            message: "Access code verified successfully.",
        });
    } catch (error) {
        console.error("Error verifying access code:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


export {generateAccessCode, verifyAccessCode, getAllAccessCodes}