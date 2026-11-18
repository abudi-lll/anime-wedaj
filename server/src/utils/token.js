import jwt from "jsonwebtoken";
export const makeToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
export const publicUser = (user) => ({
  id: user._id, name: user.name, email: user.email, role: user.role,
  subscription: user.subscription
});
