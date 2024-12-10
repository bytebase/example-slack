import { generateBBToken } from '@/app/api/utils';
import { WebClient } from '@slack/web-api';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const payload = JSON.parse(formData.get('payload') as string);
    const { action_id, value: combinedId } = payload.actions[0];
    const userId = payload.user.id;

    // Immediately acknowledge the request
    const response = new Response(JSON.stringify({ 
      response_type: 'in_channel',
      text: `Processing your request...`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    // Process the approval/denial asynchronously
    processAction(action_id, combinedId, userId, payload).catch(error => {
      console.error('Error processing action:', error);
    });

    return response;

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

// New async function to handle the actual processing
async function processAction(action_id: string, combinedId: string, userId: string, payload: any) {
  try {
    const [projectId, fullIssueId] = combinedId.split('|');
    const issueId = fullIssueId.split('-').pop();
    
    const token = await generateBBToken();
    
    const approvalURL = action_id === 'approve_request'
      ? `${process.env.BB_HOST}/v1/${projectId}/issues/${issueId}:approve`
      : `${process.env.BB_HOST}/v1/${projectId}/issues/${issueId}:reject`;

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

    // Update the original message using Slack's API
    const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    slack.chat.update({
      channel: payload.channel.id,
      ts: payload.message.ts,
      text: `${action_id === 'approve_request' ? 'Request approved' : 'Request denied'} by <@${userId}>`
    });

  } catch (error) {
    console.error('Error in processAction:', error);
    // Handle error - potentially update the Slack message with error status
  }
} 