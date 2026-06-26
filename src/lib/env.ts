const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET is missing or too short (must be >= 32 characters)");
}

export const env = { JWT_SECRET };
