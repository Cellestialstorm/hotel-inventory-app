import bcrypt from 'bcryptjs';

/**
 * Hashes a plain-text password using bcrypt.
 * @param password The plain-text password to hash.
 * @returns A promise that resolves to the hashed password.
 */

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain-text password with a hashed password using bcrypt.
 * @param The plain-text password entered by the user.
 * @param hashPassword The hashed password stored in the database.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */

export const comparePassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};