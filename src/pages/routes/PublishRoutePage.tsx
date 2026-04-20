import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardTitle, Button, Input, Select, LocationPicker, Modal } from '../../components/ui';
import { VehicleSelector } from '../../components/vehicles';
import { AvailabilityManager } from '../../components/availability/AvailabilityManager';
import { useForm } from '../../hooks/useForm';
import { routesService } from '../../services/routesService';
import { ValidationError, Location } from '../../types';

interface PublishRouteFormValues {
  date: string;
  time: string;
  availableSeats: string;
  price: string;
}

export function PublishRoutePage() {
  const navigate = useNavigate();
  const [step, setStep]                 = useState(1);
  const [isSuccess, setIsSuccess]       = useState(false);
  const [createdRouteId, setCreatedRouteId] = useState<string | null>(null);
  const [showAvailModal, setShowAvailModal] = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [origin, setOrigin]             = useState<Location | null>(null);
  const [destination, setDestination]   = useState<Location | null>(null);
  const [locationErrors, setLocationErrors] = useState({ origin: '', destination: '' });
  const [vehicleId, setVehicleId]       = useState<number | null>(null);

  const validateStep1Locations = () => {
    const errs = { origin: '', destination: '' };
    if (!origin)      errs.origin      = 'El origen es obligatorio';
    if (!destination) errs.destination = 'El destino es obligatorio';
    setLocationErrors(errs);
    return !errs.origin && !errs.destination;
  };

  const validateForm = (values: PublishRouteFormValues): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (step === 1) {
      if (!origin)           errors.push({ field: 'origin',      message: 'El origen es obligatorio'  });
      if (!destination)      errors.push({ field: 'destination', message: 'El destino es obligatorio' });
      if (!values.date)      errors.push({ field: 'date',        message: 'La fecha es obligatoria'   });
      if (!values.time)      errors.push({ field: 'time',        message: 'La hora es obligatoria'    });
    }
    if (step === 2) {
      if (!values.availableSeats) errors.push({ field: 'availableSeats', message: 'El número de cupos es obligatorio' });
      if (!values.price)          errors.push({ field: 'price',          message: 'El precio es obligatorio'          });
      if (Number(values.price) < 0) errors.push({ field: 'price',        message: 'El precio debe ser mayor o igual a 0' });
    }
    return errors;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { values, handleChange, getFieldError } =
    useForm<PublishRouteFormValues>({
      initialValues: {
        date: '', time: '', availableSeats: '3', price: '',
      },
      validate: validateForm,
      onSubmit: async () => {},
    });

  const handlePublish = async () => {
    if (!origin || !destination) return;
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const departureTime = new Date(`${values.date}T${values.time}:00`).toISOString();

      const newRoute = await routesService.createRoute({
        origin: { name: origin.address, lat: origin.lat, lng: origin.lng },
        destination: { name: destination.address, lat: destination.lat, lng: destination.lng },
        departureTime,
        pricePerSeat: Number(values.price),
        status: 'ACTIVE',
        vehicleId: vehicleId !== null ? String(vehicleId) : undefined,
      });

      const travelDate = new Date(`${values.date}T00:00:00.000Z`).toISOString();
      await routesService.addAvailabilityRule(newRoute.id, {
        kind: 'SPECIFIC_DATES',
        entries: [{ date: travelDate, seats: Number(values.availableSeats) }],
      });

      setCreatedRouteId(newRoute.id);
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al publicar la ruta';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const locOk = validateStep1Locations();
      const formOk = validateForm(values).filter(e =>
        e.field !== 'origin' && e.field !== 'destination'
      ).length === 0;
      if (locOk && formOk) setStep(2);
    } else if (step === 2) {
      const errs = validateForm(values);
      if (errs.length === 0) setStep(3);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">¡Ruta Publicada!</h2>
          <p className="text-gray-200 mt-2">
            Tu ruta ya está disponible para que otros estudiantes puedan reservarla.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={() => navigate('/bookings')} className="border-white/30 text-white hover:bg-white/10">
              Ir a Mis Viajes
            </Button>
            {createdRouteId && (
              <Button variant="primary" onClick={() => setShowAvailModal(true)}>
                Gestionar disponibilidad
              </Button>
            )}
          </div>
        </div>

        {createdRouteId && (
          <Modal isOpen={showAvailModal} onClose={() => setShowAvailModal(false)} title="Gestionar Disponibilidad" size="md">
            <AvailabilityManager routeId={createdRouteId} />
          </Modal>
        )}
      </div>
    );
  }

  const stepLabels = ['Ruta', 'Cupos', 'Vehículo'];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Publicar una Ruta</h1>
        <p className="text-gray-200 mt-1">
          Comparte tu viaje y ayuda a otros estudiantes a ahorrar dinero
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              <span className={`text-xs font-medium ${step >= s ? 'text-primary' : 'text-gray-400'}`}>
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 mx-2 mb-5 rounded ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <form onSubmit={e => e.preventDefault()}>

          {/* Step 1: Route details */}
          {step === 1 && (
            <div className="space-y-4">
              <CardTitle>Detalles de la Ruta</CardTitle>
              <p className="text-gray-600 text-sm mb-4">
                Selecciona el origen y destino en el mapa, luego indica la fecha y hora.
              </p>

              <LocationPicker
                label="Origen"
                value={origin}
                onChange={loc => { setOrigin(loc); setLocationErrors(e => ({ ...e, origin: '' })); }}
                placeholder="Toca para seleccionar punto de partida"
                error={locationErrors.origin}
                autoGeolocate
              />

              <LocationPicker
                label="Destino"
                value={destination}
                onChange={loc => { setDestination(loc); setLocationErrors(e => ({ ...e, destination: '' })); }}
                placeholder="Toca para seleccionar punto de llegada"
                error={locationErrors.destination}
                defaultCenter={[4.6356, -74.0843]}
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

          {/* Step 2: Seats & price */}
          {step === 2 && (
            <div className="space-y-4">
              <CardTitle>Cupos y Precio</CardTitle>
              <p className="text-gray-600 text-sm mb-4">
                ¿Cuántos asientos tienes disponibles y cuál es el precio?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Cupos Disponibles"
                  name="availableSeats"
                  value={values.availableSeats}
                  onChange={handleChange}
                  options={[
                    { value: '1', label: '1 cupo'  },
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

              {origin && destination && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Resumen de la ruta
                  </p>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-1 gap-1 flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <div className="w-0.5 h-6 bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-secondary" />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <div>
                        <p className="text-xs text-gray-500">Origen</p>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {origin.address.split(',')[0].trim()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Destino</p>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {destination.address.split(',')[0].trim()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Sugerencia:</strong> El promedio suele estar entre $5.000 y $10.000 COP por cupo.
                </p>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Vehicle selection */}
          {step === 3 && (
            <div className="space-y-4">
              <CardTitle>Vehículo</CardTitle>
              <p className="text-gray-600 text-sm mb-4">
                Selecciona el vehículo con el que realizarás el viaje (opcional).
              </p>

              <VehicleSelector value={vehicleId} onChange={setVehicleId} />

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                Atrás
              </Button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <Button type="button" variant="primary" onClick={handleNext}>
                Continuar
              </Button>
            ) : (
              <Button type="button" variant="primary" isLoading={isSubmitting} onClick={handlePublish}>
                Publicar Ruta
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
