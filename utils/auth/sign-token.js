import jwt from "jsonwebtoken";

const signToken = (id) => {
    return jwt.sign({ id }, process.env.SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  };

  export {signToken}