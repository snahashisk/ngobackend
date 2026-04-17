import jwt from "jsonwebtoken";

const generateVoteToken = (userId, reportId) => {
  return jwt.sign({ userId, reportId }, process.env.VOTE_TOKEN_SECRET, { expiresIn: "6h" });
};

export { generateVoteToken };
