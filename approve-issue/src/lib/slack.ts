import { WebClient } from '@slack/web-api';
import { DataAccessRequest } from '@/types/bytebase';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

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

  return await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID!,
    blocks,
    text: `New SQL Editor access request from ${request.requester}`
  });
} 