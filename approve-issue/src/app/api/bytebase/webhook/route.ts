import { sendAccessRequestNotification } from '@/lib/slack';
import { BytebaseBlock } from '@/types/bytebase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received Bytebase webhook payload:', body);

    const blocks: BytebaseBlock[] = body.blocks;
    console.log('Parsed blocks:', blocks);

    // Extract information from blocks
    const projectId = blocks.find(b => b.text?.text.includes('*Project ID:*'))
      ?.text?.text.split('*Project ID:*')[1].trim();
    console.log('Extracted projectId:', projectId);
    
    const issueTitle = blocks.find(b => b.text?.text.includes('*Issue:*'))
      ?.text?.text.split('*Issue:*')[1].trim();
    console.log('Extracted issueTitle:', issueTitle);
    
    const issueCreator = blocks.find(b => b.text?.text.includes('*Issue Creator:*'))
      ?.text?.text.split('*Issue Creator:*')[1].trim();
    console.log('Extracted issueCreator:', issueCreator);

    const issueUrl = blocks.find(b => b.type === 'actions')
      ?.elements?.[0]?.url || '';
    console.log('Extracted issueUrl:', issueUrl);

    // Extract issue ID from URL
    const issueId = issueUrl.split('/issues/')[1];
    console.log('Extracted issueId:', issueId);

    if (!projectId || !issueTitle || !issueCreator) {
      throw new Error('Required fields missing from webhook payload');
    }

    await sendAccessRequestNotification({
      taskId: `${projectId}|${issueId}`,
      requester: issueCreator,
      database: issueTitle,
      environment: projectId,
      description: `Issue URL: ${issueUrl}`
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 