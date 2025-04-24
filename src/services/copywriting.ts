interface CopywritingRequest {
  title: string;
  topic: string;
  copyType: string;
  tone: string;
  targetAudience?: string;
  keyPoints?: string[];
  structure?: string;
  wordCount?: string;
  result: string;
}

interface CopywritingResponse {
  creation: {
    id: string;
    userId: string;
    title: string;
    type: 'copywriting';
    content: Omit<CopywritingRequest, 'title'>;
    createdAt: string;
    updatedAt: string;
  };
}

export async function saveCopywriting(data: CopywritingRequest): Promise<CopywritingResponse> {
  const response = await fetch('/api/copywriting', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao salvar a copy');
  }

  return response.json();
} 