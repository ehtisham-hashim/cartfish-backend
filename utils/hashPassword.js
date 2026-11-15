import bcrypt from "bcrypt";

async function hashPass(password) {
  const hashedPass = await bcrypt.hash(password, 10);
  return hashedPass;
}

export default hashPass;
