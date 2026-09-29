function adminPasswordError(candidate) {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    return "Admin actions are disabled until ADMIN_PASSWORD is set in .env.";
  }

  if (typeof candidate !== "string") {
    return "Enter the admin password to confirm this action.";
  }

  if (candidate !== configuredPassword) {
    return "The admin password is incorrect. No changes were made.";
  }

  return null;
}

module.exports = adminPasswordError;