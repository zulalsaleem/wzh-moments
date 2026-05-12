export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const generateOTPExpiry = () =>
  new Date(Date.now() + 10 * 60 * 1000);
