const subscriptionMiddlewareUser = (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access. User not found in request.",
        });
      }
  
      if (!req.user.is_subscription_paid) {
        return res.status(402).json({
          success: false,
          message: "Access denied. Please purchase a subscription to use this feature.",
        });
      }
  
      next();
    } catch (error) {
      console.error("Error in subscription middleware:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
  
  export { subscriptionMiddlewareUser };
  