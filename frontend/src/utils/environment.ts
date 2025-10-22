

export function getBackendUrl(): string | undefined {
  // If NEXT_PUBLIC_BACKEND_URL is set (by deployment scripts), use it
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    return backendUrl;
  }
}

export function getWristbandSignupUrl(): string {
  const signupUrl = process.env.NEXT_PUBLIC_APPLICATION_SIGNUP_URL;
  if (!signupUrl) {
    throw new Error('NEXT_PUBLIC_APPLICATION_SIGNUP_URL is not set');
  }
  return signupUrl;
}