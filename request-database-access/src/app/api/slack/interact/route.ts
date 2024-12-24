import { WebClient } from '@slack/web-api';
import { fetchDatabasesForProject } from '@/app/api/utils';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function GET(req: Request) {
  console.log('INTERACT GET request received-----------------');
  return new Response('Hello, World!', { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const payload = JSON.parse(new URLSearchParams(body).get('payload') || '');
    console.log('Interaction type:', payload.type);
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    // Handle project selection
    if (payload.type === 'block_actions' && payload.actions?.[0]?.action_id === 'project_input') {
      const selectedProject = payload.actions[0].selected_option.value;
      const viewId = payload.container.view_id;
      
      // First show loading message
      await slack.views.update({
        view_id: viewId,
        view: {
          type: 'modal',
          title: payload.view.title,
          submit: payload.view.submit,
          blocks: [
            ...payload.view.blocks.slice(0, 2), // Keep requester and project blocks
            {
              type: 'section',
              block_id: 'database_loading',
              text: {
                type: 'mrkdwn',
                text: ':hourglass_flowing_sand: *Loading databases...*'
              }
            },
            ...payload.view.blocks.slice(3) // Keep other blocks (reason, expiration)
          ],
          callback_id: 'database_access_request'
        }
      });

      // Fetch databases for selected project
      const databases = await fetchDatabasesForProject(selectedProject);
      
      // Update with fetched data
      await slack.views.update({
        view_id: viewId,
        view: {
          type: 'modal',
          title: payload.view.title,
          submit: payload.view.submit,
          blocks: [
            ...payload.view.blocks.slice(0, 2), // Keep requester and project blocks
            {
              type: 'input',
              block_id: 'database_block',
              element: {
                type: 'static_select',
                action_id: 'database_input',
                placeholder: {
                  type: 'plain_text',
                  text: 'Select database'
                },
                options: databases.length > 0 
                  ? databases.map(db => ({
                      text: {
                        type: 'plain_text',
                        text: db.name
                      },
                      value: db.id
                    }))
                  : [{
                      text: {
                        type: 'plain_text',
                        text: 'No databases available'
                      },
                      value: 'no_db'
                    }]
              },
              label: {
                type: 'plain_text',
                text: 'Database'
              }
            },
            ...payload.view.blocks.slice(3) // Keep other blocks (reason, expiration)
          ],
          callback_id: 'database_access_request'
        }
      });
    }

    return new Response('', { status: 200 });
  } catch (error) {
    console.error('Error in interact route:', error);
    return new Response('Error processing interaction', { status: 500 });
  }
} 