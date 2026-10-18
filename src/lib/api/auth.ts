import { httpClient } from './client';
import { AuthUserDto, LoginRequestDto, LoginResponseDto } from './types';

export const authApi = {
  login(credentials: LoginRequestDto): Promise<LoginResponseDto> {
    return httpClient.post<LoginResponseDto>('/auth/login', credentials);
  },

  logout(): Promise<{ success: boolean }> {
    return httpClient.post<{ success: boolean }>('/auth/logout');
  },

  getCurrentUser(): Promise<AuthUserDto> {
    return httpClient.get<AuthUserDto>('/auth/me');
  },
};
