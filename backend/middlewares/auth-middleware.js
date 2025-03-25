import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "JSONTW3BT0k3nS3KR3t";

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Add user details to request
    next(); // Proceed to the next function
  } catch (error) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

export default authMiddleware;
