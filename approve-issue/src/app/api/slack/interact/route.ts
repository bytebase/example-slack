import { generateBBToken } from '@/app/api/utils';
import { WebClient } from '@slack/web-api';

type SlackPayload = {
  actions: Array<{ action_id: string; value: string }>;
  user: { id: string };
  channel: { id: string };
  message: { ts: string };
};

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const payload = JSON.parse(formData.get('payload') as string) as SlackPayload;

    // Process asynchronously and return immediate acknowledgment
    processAction(payload).catch(console.error);
    return new Response(
      JSON.stringify({ response_type: 'in_channel', replace_original: false, text: 'Processing your request...' }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error handling interaction:', error);
    return new Response(
      JSON.stringify({ 
        response_type: 'ephemeral', 
        text: 'Failed to process the request. Please try again or contact support.' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function processAction(payload: SlackPayload) {
  try {
    const { action_id, value: combinedId } = payload.actions[0];
    const [projectId, fullIssueId] = combinedId.split('|');
    const issueId = fullIssueId.split('-').pop();
    const isApproval = action_id === 'approve_request';
    const action = isApproval ? 'approve' : 'reject';
    
    const response = await fetch(
      `${process.env.BB_HOST}/v1/${projectId}/issues/${issueId}:${action}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await generateBBToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) throw new Error(`Failed to ${action} request: ${response.statusText}`);

    await slack.chat.postMessage({
      channel: payload.channel.id,
      text: `${isApproval ? 'Request approved' : 'Request denied'} by <@${payload.user.id}>`
    });

  } catch (error) {
    console.error('Error in processAction:', error);
    await slack.chat.postMessage({
      channel: payload.channel.id,
      text: '❌ Failed to process the request. Please try again or contact support.'
    });
  }
} 