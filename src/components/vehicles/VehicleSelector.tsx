'use client';
import { useState, useEffect } from 'react';
import { Button } from '../ui';
import { vehiclesService, Vehicle, CreateVehiclePayload } from '../../services/vehiclesService';
import { VehicleForm } from './VehicleForm';

interface VehicleSelectorProps {
  value: number | null;
  onChange: (id: number | null) => void;
}

export function VehicleSelector({ value, onChange }: VehicleSelectorProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    vehiclesService.getMyVehicles()
      .then(v => { setVehicles(v); if (v.length === 0) setShowForm(true); })
      .catch(() => setShowForm(true))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (payload: CreateVehiclePayload) => {
    setIsSaving(true);
    try {
      const newVehicle = await vehiclesService.createVehicle(payload);
      setVehicles(v => [...v, newVehicle]);
      onChange(newVehicle.id);
      setShowForm(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500 py-4 text-center">Cargando vehículos...</p>;
  }

  return (
    <div className="space-y-3">
      {vehicles.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {vehicles.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange(value === v.id ? null : v.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                value === v.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${value === v.id ? 'bg-primary' : 'bg-gray-300'}`} />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{v.plate}</p>
                  <p className="text-xs text-gray-500">
                    {v.vehicle_type}{v.brand ? ` · ${v.brand}` : ''}{v.model ? ` ${v.model}` : ''}{v.color ? ` · ${v.color}` : ''}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!showForm && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(true)}
          className="w-full border border-dashed border-gray-300 hover:border-primary hover:text-primary"
        >
          + Agregar vehículo
        </Button>
      )}

      {showForm && (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700 mb-3">Nuevo vehículo</p>
          <VehicleForm
            onSubmit={handleCreate}
            onCancel={vehicles.length > 0 ? () => setShowForm(false) : undefined}
            isLoading={isSaving}
          />
        </div>
      )}
    </div>
  );
}
