import { CreationType, CopywritingContent, LandingPageContent } from '@/lib/db/models/UserCreation';

interface UserCreation {
  id: string;
  userId: string;
  title: string;
  type: CreationType;
  content: CopywritingContent | LandingPageContent;
  createdAt: string;
  updatedAt: string;
}

interface UserCreationsResponse {
  creations: UserCreation[];
}

export async function getUserCreations(): Promise<UserCreationsResponse> {
  const response = await fetch('/api/user-creations');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar criações');
  }
  
  return response.json();
}

export async function getUserCreationsByType(type: CreationType): Promise<UserCreationsResponse> {
  const response = await fetch(`/api/user-creations?type=${type}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar criações');
  }
  
  return response.json();
}

export async function getUserCreationById(id: string): Promise<{ creation: UserCreation }> {
  const response = await fetch(`/api/user-creations?id=${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar criação');
  }
  
  return response.json();
}

export async function deleteUserCreation(id: string): Promise<void> {
  const response = await fetch(`/api/user-creations/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao excluir criação');
  }
} 