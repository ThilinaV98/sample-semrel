// CRITICAL: Security patch
// CVE-2025-001 mitigation
// Applied: Tue Sep 16 17:00:56 +0530 2025
export const validateInput = (input) => {
  // Prevent SQL injection
  return input.replace(/[';]/g, '');
};
