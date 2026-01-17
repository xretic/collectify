export default function isPasswordValid(password: string): boolean {
  const regex = /^[a-zA-Z0-9!@#$%^&*()]+$/;
  return regex.test(password);
}
