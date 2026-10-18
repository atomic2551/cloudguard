import { httpClient } from './client';
import { CreateUserDto, PaginatedResponse, QueryParams, UpdateUserDto, UserDto } from './types';

export const usersApi = {
  list(params?: QueryParams): Promise<PaginatedResponse<UserDto>> {
    return httpClient.get<PaginatedResponse<UserDto>>('/users', params);
  },

  getById(id: string): Promise<UserDto> {
    return httpClient.get<UserDto>(`/users/${id}`);
  },

  create(payload: CreateUserDto): Promise<UserDto> {
    return httpClient.post<UserDto>('/users', payload);
  },

  update(id: string, payload: UpdateUserDto): Promise<UserDto> {
    return httpClient.patch<UserDto>(`/users/${id}`, payload);
  },
};
