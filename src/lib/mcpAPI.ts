// src/lib/mcpAPI.ts

import { API_BASE_URL, DEPLOY_API_BASE_URL } from './config';

export interface InstanceAddressEntry {
  addr?: string;
  type?: string;
  version?: number;
  ['OS-EXT-IPS:type']?: string;
  [key: string]: unknown;
}

export type InstanceAddresses = Record<string, InstanceAddressEntry[]>;

export interface InstanceInfo {
  instance_id: string;
  name: string;
  image_name: string;
  flavor_name: string;
  network_name: string;
  key_name: string;
  metadata?: Record<string, string> | null;
  user_data?: string | null;
  status: string;
  addresses: InstanceAddresses;
}

export interface DeployResponse {
  accepted: boolean;
  plan_id?: string | null;
  instance_id?: string | null;
  instance?: InstanceInfo | null;
  message: string;
  deployed_at?: string | null;
}

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorMessage = '예측 요청에 실패했습니다.';
    try {
      const errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      if (res.status === 401) {
        errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
      } else if (res.status === 403) {
        errorMessage = '접근 권한이 없습니다.';
      } else {
        errorMessage = res.statusText || errorMessage;
      }
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

export const mcpApi = {
  // Context JSON을 예쁘게 포장해서 MCP로 전송
  // 배포는 MCP -> mcp_core -> CI/CD로 자동 처리됨
  sendContextToMCP: async (
    payload: {
      service_id: string
      metric_name: string
      context: { github_url: string }
      requirements: string
    },
    token: string
  ) => {
    // Context JSON을 예쁘게 포장해서 MCP로 전송
    // 프론트엔드에서는 GitHub URL만 전달하고, 나머지 필드들은 MCP가 자동으로 채움
    // 자연어 요청사항은 별도 필드로 전송
    const formattedPayload = {
      service_id: payload.service_id,
      metric_name: payload.metric_name,
      context: {
        github_url: payload.context.github_url,
        // 나머지 필드들(timestamp, service_type, runtime_env, time_slot, weight, region, curr_cpu, curr_mem, expected_users)은 MCP가 채움
      },
      requirements: payload.requirements, // 자연어 요청사항 (string으로 래핑)
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formattedPayload, null, 2) // 예쁘게 포장된 JSON
    });
    return handleResponse(res);
  },

  // 배포 요청 (MCP Core DeployRequest 스키마에 맞춤)
  // DeployRequest (백엔드): github_url, repo_id?, image_tag?, plan_id?, env_config
  deploy: async (deployData: {
    github_url: string;
    // 자연어 요구사항 — 서버가 배포 시 generate_plan 을 재실행하므로, 이걸 넘겨야 예측 단계에서
    // 보여준 flavor/컨텍스트가 실제 배포에서 그대로 재현된다(안 넘기면 빈 컨텍스트로 재산출).
    natural_language?: string;
    repo_id?: string;
    image_tag?: string;
    plan_id?: string;
    env_config?: Record<string, unknown>;
  }, token?: string): Promise<DeployResponse> => {
    const res = await fetch(`${DEPLOY_API_BASE_URL}/api/v1/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(deployData)
    });
    const data: DeployResponse = await handleResponse(res);
    return data;
  },

  // 리소스 삭제 — 백엔드: DELETE /api/v1/deploy/{instance_id} (Bearer 필요).
  destroy: async (instance_id: string, token: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/deploy/${instance_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(res);
  }
};

export interface Project {
  id: number;
  name: string;
  repository: string;
  status: "deployed" | "building" | "error" | "stopped";
  // 백엔드 ProjectResponse 와 동일한 snake_case (예전엔 lastDeployment 로 어긋나 항상 undefined).
  last_deployment: string | null;
  url: string | null;
  instance_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectsResponse {
  projects: Project[];
}

export const projectsApi = {
  // 프로젝트 목록 조회
  getProjects: async (token: string): Promise<ProjectsResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(res);
  },

  // 프로젝트 생성
  createProject: async (projectData: {
    name: string;
    repository: string;
    status?: "deployed" | "building" | "error" | "stopped";
    url?: string | null;
    instance_id?: string | null;
    last_deployment?: string | null;
    // 예측이 뽑은 컨텍스트를 함께 실어야 upsert 가 기본값(web/prod/normal)으로 덮지 않는다.
    service_type?: string;
    runtime_env?: string;
    time_slot?: string;
    expected_users?: number | null;
  }, token: string): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(projectData)
    });
    return handleResponse(res);
  },

  // 프로젝트 상세 조회
  getProject: async (projectId: number, token: string): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(res);
  },

  // 프로젝트 업데이트
  updateProject: async (
    projectId: number,
    projectData: {
      name?: string;
      repository?: string;
      status?: "deployed" | "building" | "error" | "stopped";
      url?: string;
      service_id?: string;
      instance_id?: string;
    },
    token: string
  ): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(projectData)
    });
    return handleResponse(res);
  },

  // 프로젝트 삭제
  deleteProject: async (projectId: number, token: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || '프로젝트 삭제에 실패했습니다.');
    }
  }
};
