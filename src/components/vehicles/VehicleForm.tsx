'use client';
import { useState } from 'react';
import { Button, Input, Select } from '../ui';
import { CreateVehiclePayload } from '../../services/vehiclesService';

interface VehicleFormProps {
  onSubmit: (payload: CreateVehiclePayload) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function VehicleForm({ onSubmit, onCancel, isLoading = false }: VehicleFormProps) {
  const [values, setValues] = useState({
    plate: '',
    vehicle_type: 'Carro',
    brand: '',
    model: '',
    color: '',
    year: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, val: string) => {
    setValues(v => ({ ...v, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!values.plate.trim()) newErrors.plate = 'La placa es obligatoria';
    if (!values.vehicle_type) newErrors.vehicle_type = 'Selecciona un tipo';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    await onSubmit({
      plate: values.plate.trim().toUpperCase(),
      vehicle_type: values.vehicle_type,
      brand: values.brand || undefined,
      model: values.model || undefined,
      color: values.color || undefined,
      year: values.year ? Number(values.year) : undefined,
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Placa"
          placeholder="Ej. ABC123"
          value={values.plate}
          onChange={e => set('plate', e.target.value)}
          error={errors.plate}
        />
        <Select
          label="Tipo"
          value={values.vehicle_type}
          onChange={e => set('vehicle_type', e.target.value)}
          options={[
            { value: 'Carro', label: 'Carro' },
            { value: 'Moto', label: 'Moto' },
            { value: 'Otro', label: 'Otro' },
          ]}
          error={errors.vehicle_type}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Marca (opcional)"
          placeholder="Ej. Chevrolet"
          value={values.brand}
          onChange={e => set('brand', e.target.value)}
        />
        <Input
          label="Modelo (opcional)"
          placeholder="Ej. Spark"
          value={values.model}
          onChange={e => set('model', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Color (opcional)"
          placeholder="Ej. Blanco"
          value={values.color}
          onChange={e => set('color', e.target.value)}
        />
        <Input
          label="Año (opcional)"
          type="number"
          placeholder="Ej. 2020"
          value={values.year}
          onChange={e => set('year', e.target.value)}
          min="1990"
          max={String(new Date().getFullYear())}
        />
      </div>
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="button" variant="primary" size="sm" isLoading={isLoading} onClick={handleSave} className="flex-1">
          Guardar vehículo
        </Button>
      </div>
    </div>
  );
}
