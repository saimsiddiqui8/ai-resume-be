import { getOpenAIResponse } from "../../utils/chat/openaAi.js";
import { chatSchema } from "../../validators/chatbot-validations.js";

const chatWithBot = async (req, res) => {
    try {
      // Validate request body
      const { error, value } = chatSchema.validate(req.body, { abortEarly: false });
  
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details.map((err) => err.message).join(", "),
        });
      }
  
      const { message } = value;
  
      // Get response from OpenAI
      const botResponse = await getOpenAIResponse(message);
  
      return res.status(200).json({
        success: true,
        data: botResponse,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  export {chatWithBot}