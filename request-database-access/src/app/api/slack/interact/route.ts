import { WebClient } from '@slack/web-api';
import { fetchDatabasesForProject } from '@/app/api/utils';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function GET(req: Request) {
  console.log('INTERACT GET request received-----------------');
  return new Response('Hello, World!', { status: 200 });
}

export async function POST(req: Request) {
  console.log('=== Interact endpoint called ===');
  
  try {
    const body = await req.text();
    const payload = JSON.parse(new URLSearchParams(body).get('payload') || '');
    console.log('Payload type:', payload.type);

    // Handle project selection
    if (payload.type === 'block_actions' && payload.actions?.[0]?.action_id === 'project_input') {
      console.log('Project selection detected');
      const selectedProjectId = payload.actions[0].selected_option.value;
      const viewId = payload.view.id;
      
      console.log('Selected project:', selectedProjectId);
      
      // Fetch databases for the selected project
      const databases = await fetchDatabasesForProject(selectedProjectId);
      console.log('Fetched databases:', JSON.stringify(databases, null, 2));

      if (!databases || databases.length === 0) {
        console.log('No databases found for project:', selectedProjectId);
        databases = [{ id: 'no_db', name: 'No databases available' }];
      }

      const updatedView = {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Database Access Request'
        },
        submit: {
          type: 'plain_text',
          text: 'Submit'
        },
        blocks: [
          // Preserve the requester block
          payload.view.blocks[0],
          // Preserve the project selection block
          payload.view.blocks[1],
          // Update the database selection block
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
              options: databases.map(db => ({
                text: {
                  type: 'plain_text',
                  text: db.name
                },
                value: db.id
              }))
            },
            label: {
              type: 'plain_text',
              text: 'Database'
            }
          },
          // Preserve the reason block
          payload.view.blocks[3],
          // Preserve the expiration block
          payload.view.blocks[4]
        ],
        callback_id: 'database_access_request'
      };

      console.log('Updating view with:', JSON.stringify(updatedView, null, 2));

      // Update the modal with the new database options
      await slack.views.update({
        view_id: viewId,
        view: updatedView
      });

      return new Response('', { status: 200 });
    }

    return new Response('', { status: 200 });
  } catch (error) {
    console.error('Error handling interaction:', error);
    return new Response('Error processing interaction', { status: 500 });
  }
} 