export interface BytebaseBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  elements?: Array<{
    type: string;
    url?: string;
    text?: {
      type: string;
      text: string;
    };
  }>;
}

export interface DataAccessRequest {
  taskId: string;
  requester: string;
  database: string;
  environment: string;
  description?: string;
} 