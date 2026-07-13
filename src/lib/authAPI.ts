// src/lib/authAPI.ts

import { API_BASE_URL } from './config';

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorMessage = '요청에 실패했습니다.';
    try {
      const errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

export interface UserProfile {
  email: string;
  github_repo_url: string | null;
  created_at: string;
}

// 인증은 아주대 SSO(Keycloak) 단일 — 이메일 login/self-signup 은 제거됨.
export const authApi = {
  // 유저 프로필 조회
  getProfile: async (token: string): Promise<UserProfile> => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(res);
  },

  // 프로젝트/프로필 정보 업데이트 (GitHub URL, 자연어 요구사항 등)
  updateProfile: async (
    projectData: {
      github_repo_url?: string;
      requirements?: string;
    },
    token: string
  ) => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(projectData)
    });
    return handleResponse(res);
  },

  // 회원 탈퇴
  deleteAccount: async (token: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(res);
  }
};
