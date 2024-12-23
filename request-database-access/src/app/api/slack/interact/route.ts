import { createBytebaseIssue } from '@/lib/bytebase';
import { WebClient } from '@slack/web-api';
import { fetchDatabasesForProject } from '@/app/api/utils';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const payload = JSON.parse(new URLSearchParams(body).get('payload') || '');

    console.log('Payload===============', payload);
    
    // Handle project selection
    if (payload.type === 'block_actions' && payload.actions?.[0]?.action_id === 'project_input') {
      const selectedProjectId = payload.actions[0].selected_option.value;
      const viewId = payload.view.id;
      
      console.log('selectedProjectId ===============', selectedProjectId);
      // Fetch databases for the selected project
      const databases = await fetchDatabasesForProject(selectedProjectId);
      console.log('databases ===============', databases);
      
      // Update the database dropdown with the fetched options
      await slack.views.update({
        view_id: viewId,
        view: {
          ...payload.view,
          blocks: payload.view.blocks.map(block => {
            if (block.block_id === 'database_block') {
              return {
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
              };
            }
            return block;
          })
        }
      });

      return Response.json({ ok: true });
    }

    // Handle form submission
    if (payload.type === 'view_submission' && payload.view.callback_id === 'database_access_request') {
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
    }

    return Response.json({ ok: true });

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