import { WebClient } from '@slack/web-api';
import { DataAccessRequest } from '@/types/bytebase';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

async function findBotChannels(): Promise<string[]> {
  try {
    const result = await slack.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 1000
    });
    
    // Filter channels where the bot is a member
    const botChannels = result.channels?.filter(
      (channel) => channel.is_member
    ).map(channel => channel.id) || [];
    
    if (botChannels.length === 0) {
      throw new Error('Bot is not a member of any channels');
    }
    
    return botChannels;
  } catch (error) {
    console.error('Error finding bot channels:', error);
    throw error;
  }
}

export async function sendAccessRequestNotification(request: DataAccessRequest) {
  console.log('Preparing Slack notification with request:', request);

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🔐 New SQL Editor Access Request",
        emoji: true
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Project:*\n${request.environment}`
        },
        {
          type: "mrkdwn",
          text: `*Requester:*\n${request.requester}`
        }
      ]
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Request Details:*\n${request.database}`
      }
    }
  ];

  // Add description if available (contains the issue URL)
  if (request.description) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: request.description
      }
    });
  }

  // Add approval buttons
  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "✅ Approve",
          emoji: true
        },
        style: "primary",
        action_id: "approve_request",
        value: request.taskId
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "❌ Deny",
          emoji: true
        },
        style: "danger",
        action_id: "deny_request",
        value: request.taskId
      }
    ]
  });

  const botChannels = await findBotChannels();
  // Use the first channel where the bot is a member
  const channelId = botChannels[0];
  
  return await slack.chat.postMessage({
    channel: channelId,
    blocks,
    text: `New SQL Editor access request from ${request.requester}`
  });
} 