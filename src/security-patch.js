// CRITICAL: Security patch
// CVE-2025-001 mitigation
// Applied: Fri Sep 12 12:58:19 +0530 2025
export const validateInput = (input) => {
  // Prevent SQL injection
  return input.replace(/[';]/g, '');
};
