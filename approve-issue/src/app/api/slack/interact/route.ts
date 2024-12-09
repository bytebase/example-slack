import { generateBBToken } from '@/app/api/utils';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const payload = JSON.parse(formData.get('payload') as string);

    const { action_id, value: combinedId } = payload.actions[0];
    const userId = payload.user.id;

    // Parse the combined ID back into project and issue IDs
    const [projectId, fullIssueId] = combinedId.split('|');
    
    // Extract just the numeric ID from the end of the issue string
    const issueId = fullIssueId.split('-').pop();

    const token = await generateBBToken();

    let approvalURL;
    if (action_id === 'approve_request') {
      approvalURL = `${process.env.BB_HOST}/v1/${projectId}/issues/${issueId}:approve`;
    } else if (action_id === 'deny_request') {
      approvalURL = `${process.env.BB_HOST}/v1/${projectId}/issues/${issueId}:reject`;
    } else {
      throw new Error('Invalid action');
    }

    const res = await fetch(approvalURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to ${action_id} request`);
    }

    const message = action_id === 'approve_request' 
      ? 'Request approved' 
      : 'Request denied';

    return new Response(JSON.stringify({ 
      response_type: 'in_channel',
      replace_original: true,
      text: `${message} by <@${userId}>`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${message} by <@${userId}>`
          }
        }
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error handling interaction:', error);
    return new Response(JSON.stringify({ 
      response_type: 'ephemeral',
      text: 'Failed to process the request. Please try again or contact support.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 