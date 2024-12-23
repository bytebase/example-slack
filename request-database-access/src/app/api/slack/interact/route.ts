import { createBytebaseIssue } from '@/lib/bytebase';
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const payload = JSON.parse(new URLSearchParams(body).get('payload') || '');

    console.log('submit form Payload===', payload);
    
    if (payload.type !== 'view_submission' || payload.view.callback_id !== 'database_access_request') {
      return Response.json({ ok: true });
    }

    const values = payload.view.state.values;
    const database = values.database_block.database_input.value;
    const environment = values.environment_block.environment_input.selected_option.value;
    const userId = payload.user.id;
    const userName = payload.user.name;

    const issue = await createBytebaseIssue({
      title: `Access Request: ${database}`,
      creator: userName,
      database,
      environment,
      description: `Access requested by <@${userId}> for database ${database} in ${environment} environment.`
    });

    // Post message in channel
    await slack.chat.postMessage({
      channel: userId, // DM the user
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔐 *Database Access Request Submitted*\n\n*Database:* ${database}\n*Environment:* ${environment}\n\n*Status:* Request created in Bytebase\n*Issue Link:* ${issue.url}`
          }
        }
      ]
    });

    return Response.json({ response_action: 'clear' });

  } catch (error) {
    console.error('Error processing interaction:', error);
    return Response.json({
      response_action: 'errors',
      errors: {
        database_block: 'An error occurred while processing your request.'
      }
    });
  }
} 