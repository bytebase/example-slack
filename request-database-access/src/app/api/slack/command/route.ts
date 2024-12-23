import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function POST(req: Request) {
  console.log('POST request received');
  
  try {
    const formData = await req.formData();
    console.log('Form data:', Object.fromEntries(formData.entries()));
    
    const triggerId = formData.get('trigger_id');
    const userId = formData.get('user_id');

    if (!triggerId || !userId) {
      console.error('Missing trigger_id or user_id');
      return new Response(JSON.stringify({
        response_type: 'ephemeral',
        text: 'Error: Could not open modal'
      }), { status: 400 });
    }

    // Open the modal immediately with a loading state
    const modalResponse = await slack.views.open({
      trigger_id: triggerId.toString(),
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Database Access Request'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Loading...'
            }
          }
        ]
      }
    });

    // After modal is opened, fetch the data
    const viewId = modalResponse.view?.id;
    const userInfo = await slack.users.info({ user: userId.toString() });


    console.log('userInfo ===============', userInfo);


    const requesterEmail = userInfo.user?.profile?.email || 'Unknown';
    const projects = await fetchProjectList();

    // Update the modal with full content
    await slack.views.update({
      view_id: viewId,
      view: {
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
          {
            type: 'section',
            block_id: 'requester_block',
            text: {
              type: 'mrkdwn',
              text: `*Requester:* ${requesterEmail}`
            }
          },
          {
            type: 'input',
            block_id: 'project_block',
            element: {
              type: 'static_select',
              action_id: 'project_input',
              placeholder: {
                type: 'plain_text',
                text: 'Select project'
              },
              options: projects.map(project => ({
                text: {
                  type: 'plain_text',
                  text: project.name
                },
                value: project.id
              }))
            },
            label: {
              type: 'plain_text',
              text: 'Project'
            }
          },
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
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'Please select a project first'
                  },
                  value: 'placeholder'
                }
              ]
            },
            label: {
              type: 'plain_text',
              text: 'Database'
            }
          },
          {
            type: 'input',
            block_id: 'reason_block',
            element: {
              type: 'plain_text_input',
              action_id: 'reason_input',
              placeholder: {
                type: 'plain_text',
                text: 'Enter reason for access'
              },
              multiline: true
            },
            label: {
              type: 'plain_text',
              text: 'Reason'
            }
          },
          {
            type: 'input',
            block_id: 'expiration_block',
            element: {
              type: 'static_select',
              action_id: 'expiration_input',
              placeholder: {
                type: 'plain_text',
                text: 'Select expiration'
              },
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: '1 day'
                  },
                  value: '1'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '3 days'
                  },
                  value: '3'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '30 days'
                  },
                  value: '30'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '90 days'
                  },
                  value: '90'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Never'
                  },
                  value: 'never'
                }
              ]
            },
            label: {
              type: 'plain_text',
              text: 'Expiration'
            }
          }
        ],
        callback_id: 'database_access_request'
      }
    });

    // Return a success response
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: 'Modal opened successfully'
    }), { status: 200 });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
    }), { status: 500 });
  }
}

// Function to fetch the list of projects
async function fetchProjectList() {
  // Dummy data for projects
  return [
    { id: 'project_a', name: 'Project A' },
    { id: 'project_b', name: 'Project B' },
    { id: 'project_c', name: 'Project C' }
  ];
}

// Function to fetch databases for a given project
async function fetchDatabasesForProject(projectId: string) {
  // Dummy data for databases based on project ID
  const databases = {
    project_a: [
      { id: 'db1', name: 'Database 1' },
      { id: 'db2', name: 'Database 2' }
    ],
    project_b: [
      { id: 'db3', name: 'Database 3' },
      { id: 'db4', name: 'Database 4' }
    ],
    project_c: [
      { id: 'db5', name: 'Database 5' },
      { id: 'db6', name: 'Database 6' }
    ]
  };

  return databases[projectId] || [];
} 