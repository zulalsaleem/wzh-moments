export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// 2-minute expiry
export const generateOTPExpiry = () =>
  new Date(Date.now() + 2 * 60 * 1000);

export const isOTPExpired = (expiryDate) =>
  new Date() > new Date(expiryDate);
