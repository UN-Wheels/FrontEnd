'use client';
import { api } from './api';

export interface Vehicle {
  id: number;
  plate: string;
  vehicle_type: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: number;
  notes?: string;
}

export interface CreateVehiclePayload {
  plate: string;
  vehicle_type: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: number;
  notes?: string;
}

export const vehiclesService = {
  async getMyVehicles(): Promise<Vehicle[]> {
    return api.get<Vehicle[]>('/vehicles/');
  },

  async createVehicle(data: CreateVehiclePayload): Promise<Vehicle> {
    return api.post<Vehicle>('/vehicles/', data);
  },

  async deleteVehicle(id: number): Promise<void> {
    return api.delete(`/vehicles/${id}`);
  },
};
