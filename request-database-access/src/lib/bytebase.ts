interface IssueRequest {
  title: string;
  creator: string;
  database: string;
  environment: string;
  description: string;
}

interface IssueResponse {
  url: string;
  id: string;
}

export async function createBytebaseIssue(request: IssueRequest): Promise<IssueResponse> {
  const response = await fetch(`${process.env.BB_HOST}/v1/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BB_SERVICE_KEY}`
    },
    body: JSON.stringify({
      title: request.title,
      description: request.description,
      projectId: request.environment,
      creator: request.creator,
      metadata: {
        database: request.database,
        environment: request.environment
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create Bytebase issue: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    url: `${process.env.BB_HOST}/issues/${data.id}`,
    id: data.id
  };
} 