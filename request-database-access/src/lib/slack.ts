export async function verifySlackRequest(req: Request): Promise<boolean> {
  const timestamp = req.headers.get('x-slack-request-timestamp');
  const signature = req.headers.get('x-slack-signature');

  if (!timestamp || !signature) {
    return false;
  }

  // Verify the request is not too old (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  // TODO: Implement actual signature verification
  // For now, just check if the token matches
  const formData = await req.formData();
  return formData.get('token') === process.env.SLACK_VERIFICATION_TOKEN;
} 