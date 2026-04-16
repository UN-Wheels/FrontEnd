import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardTitle, Button, Input, Select } from '../../components/ui';
import { useForm } from '../../hooks/useForm';
import { ValidationError } from '../../types';

interface PublishRouteFormValues {
  origin: string;
  destination: string;
  date: string;
  time: string;
  availableSeats: string;
  price: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  vehicleYear: string;
}

const vehicleBrands = [
  { value: 'chevrolet', label: 'Chevrolet' },
  { value: 'mazda', label: 'Mazda' },
  { value: 'renault', label: 'Renault' },
  { value: 'nissan', label: 'Nissan' },
  { value: 'toyota', label: 'Toyota' },
  { value: 'kia', label: 'Kia' },
  { value: 'hyundai', label: 'Hyundai' },
];

export function PublishRoutePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (values: PublishRouteFormValues): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (step === 1) {
      if (!values.origin.trim()) errors.push({ field: 'origin', message: 'El origen es obligatorio' });
      if (!values.destination.trim()) errors.push({ field: 'destination', message: 'El destino es obligatorio' });
      if (!values.date) errors.push({ field: 'date', message: 'La fecha es obligatoria' });
      if (!values.time) errors.push({ field: 'time', message: 'La hora es obligatoria' });
    }

    if (step === 2) {
      if (!values.availableSeats) errors.push({ field: 'availableSeats', message: 'El número de cupos es obligatorio' });
      if (!values.price) errors.push({ field: 'price', message: 'El precio es obligatorio' });
    }

    if (step === 3) {
      if (!values.vehicleBrand) errors.push({ field: 'vehicleBrand', message: 'La marca es obligatoria' });
      if (!values.vehicleModel.trim()) errors.push({ field: 'vehicleModel', message: 'El modelo es obligatorio' });
      if (!values.vehicleColor.trim()) errors.push({ field: 'vehicleColor', message: 'El color es obligatorio' });
      if (!values.vehiclePlate.trim()) errors.push({ field: 'vehiclePlate', message: 'La placa es obligatoria' });
    }

    return errors;
  };

  const { values, handleChange, handleSubmit, getFieldError, isSubmitting, errors } = useForm<PublishRouteFormValues>({
    initialValues: {
      origin: '',
      destination: '',
      date: '',
      time: '',
      availableSeats: '3',
      price: '',
      vehicleBrand: '',
      vehicleModel: '',
      vehicleColor: '',
      vehiclePlate: '',
      vehicleYear: new Date().getFullYear().toString(),
    },
    validate: validateForm,
    onSubmit: async () => {
      // Simular llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    },
  });

  const handleNext = () => {
    const stepErrors = validateForm(values);
    if (stepErrors.length === 0) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">¡Ruta Publicada!</h2>
        <p className="text-gray-200 mt-2">Tu ruta ya está disponible para que otros estudiantes puedan reservarla.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Publicar una Ruta</h1>
        <p className="text-gray-200 mt-1">Comparte tu viaje y ayuda a otros estudiantes a ahorrar dinero</p>
      </div>

      {/* Pasos de progreso */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                step >= s
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > s ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div
                className={`w-20 h-1 mx-2 rounded ${
                  step > s ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          {/* Paso 1: Detalles de la ruta */}
          {step === 1 && (
            <div className="space-y-4">
              <CardTitle>Detalles de la Ruta</CardTitle>
              <p className="text-gray-600 text-sm mb-4 text-pretty">¿Desde dónde sales y hacia dónde vas?</p>

              <Input
                label="Origen"
                name="origin"
                placeholder="Ej: Centro Comercial Andino"
                value={values.origin}
                onChange={handleChange}
                error={getFieldError('origin')}
              />

              <Input
                label="Destino"
                name="destination"
                placeholder="Ej: Universidad de los Andes"
                value={values.destination}
                onChange={handleChange}
                error={getFieldError('destination')}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Fecha"
                  type="date"
                  name="date"
                  value={values.date}
                  onChange={handleChange}
                  error={getFieldError('date')}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  label="Hora de Salida"
                  type="time"
                  name="time"
                  value={values.time}
                  onChange={handleChange}
                  error={getFieldError('time')}
                />
              </div>
            </div>
          )}

          {/* Paso 2: Cupos y precio */}
          {step === 2 && (
            <div className="space-y-4">
              <CardTitle>Cupos y Precio</CardTitle>
              <p className="text-gray-600 text-sm mb-4">¿Cuántos asientos tienes disponibles y cuál es el precio?</p>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Cupos Disponibles"
                  name="availableSeats"
                  value={values.availableSeats}
                  onChange={handleChange}
                  options={[
                    { value: '1', label: '1 cupo' },
                    { value: '2', label: '2 cupos' },
                    { value: '3', label: '3 cupos' },
                    { value: '4', label: '4 cupos' },
                  ]}
                  error={getFieldError('availableSeats')}
                />
                <Input
                  label="Precio por Cupo (COP)"
                  type="number"
                  name="price"
                  placeholder="Ej: 8000"
                  value={values.price}
                  onChange={handleChange}
                  error={getFieldError('price')}
                  min="0"
                />
              </div>

              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Sugerencia:</strong> Elige un precio justo basado en la distancia. El promedio suele estar entre $5,000 y $10,000 COP por cupo.
                </p>
              </div>
            </div>
          )}

          {/* Paso 3: Información del vehículo */}
          {step === 3 && (
            <div className="space-y-4">
              <CardTitle>Información del Vehículo</CardTitle>
              <p className="text-gray-600 text-sm mb-4">Cuéntale a los pasajeros sobre tu vehículo</p>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Marca"
                  name="vehicleBrand"
                  value={values.vehicleBrand}
                  onChange={handleChange}
                  options={vehicleBrands}
                  placeholder="Selecciona la marca"
                  error={getFieldError('vehicleBrand')}
                />
                <Input
                  label="Modelo"
                  name="vehicleModel"
                  placeholder="Ej: Spark GT"
                  value={values.vehicleModel}
                  onChange={handleChange}
                  error={getFieldError('vehicleModel')}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Color"
                  name="vehicleColor"
                  placeholder="Ej: Blanco"
                  value={values.vehicleColor}
                  onChange={handleChange}
                  error={getFieldError('vehicleColor')}
                />
                <Input
                  label="Año"
                  type="number"
                  name="vehicleYear"
                  value={values.vehicleYear}
                  onChange={handleChange}
                  min="2000"
                  max={new Date().getFullYear()}
                />
                <Input
                  label="Placa"
                  name="vehiclePlate"
                  placeholder="Ej: ABC123"
                  value={values.vehiclePlate}
                  onChange={handleChange}
                  error={getFieldError('vehiclePlate')}
                />
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={handleBack}>
                Atrás
              </Button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={errors.length > 0}
              >
                Continuar
              </Button>
            ) : (
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Publicar Ruta
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}