import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Button, Input, Avatar, Badge, Modal } from '../../components/ui';
import { reservationsService, ApiReservation } from '../../services/routesService';
import { vehiclesService, Vehicle, CreateVehiclePayload } from '../../services/vehiclesService';
import { VehicleForm } from '../../components/vehicles';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: user?.fullName || '',
    profilePicture: user?.profilePicture || '',
  });
  const [tripHistory, setTripHistory] = useState<ApiReservation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  useEffect(() => {
    reservationsService.getTripHistory()
      .then(setTripHistory)
      .catch(err => console.error('Error al cargar historial:', err))
      .finally(() => setHistoryLoading(false));

    vehiclesService.getMyVehicles()
      .then(setVehicles)
      .catch(err => console.error('Error al cargar vehículos:', err))
      .finally(() => setVehiclesLoading(false));
  }, []);

  const handleSave = () => {
    updateUser(editData);
    setIsEditing(false);
  };

  const handleAddVehicle = async (payload: CreateVehiclePayload) => {
    setIsSavingVehicle(true);
    try {
      const newVehicle = await vehiclesService.createVehicle(payload);
      setVehicles(v => [...v, newVehicle]);
      setShowVehicleForm(false);
    } catch (err) {
      console.error('Error al crear vehículo:', err);
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm('¿Eliminar este vehículo?')) return;
    try {
      await vehiclesService.deleteVehicle(id);
      setVehicles(v => v.filter(vh => vh.id !== id));
    } catch (err) {
      console.error('Error al eliminar vehículo:', err);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const statusVariant: Record<string, 'success' | 'default'> = {
    CONFIRMED: 'success',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar
                src={user?.profilePicture}
                alt={user?.fullName || 'Usuario'}
                size="xl"
                className="w-24 h-24"
              />
              <button
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
                onClick={() => setIsEditing(true)}
                title="Editar foto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-4">{user?.fullName}</h2>
            <p className="text-gray-500">{user?.email}</p>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                Editar Perfil
              </Button>
            </div>
          </div>
        </Card>

        {/* Trip history */}
        <Card className="lg:col-span-2">
          <CardTitle>Historial de Viajes</CardTitle>

          <div className="mt-4 space-y-4">
            {historyLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Cargando historial...</div>
            ) : tripHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <p>Aún no tienes historial de viajes</p>
              </div>
            ) : (
              tripHistory.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm font-mono truncate">
                        Ruta: {trip.routeId}
                      </p>
                      <Badge variant={statusVariant[trip.status] ?? 'default'} size="sm">
                        {trip.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(trip.travelDate)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Vehicles section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Mis Vehículos</CardTitle>
          {!showVehicleForm && (
            <Button variant="outline" size="sm" onClick={() => setShowVehicleForm(true)}>
              + Agregar
            </Button>
          )}
        </div>

        {vehiclesLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Cargando vehículos...</p>
        ) : (
          <div className="space-y-3">
            {vehicles.length === 0 && !showVehicleForm && (
              <div className="text-center py-6 text-gray-500">
                <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <p className="text-sm">No tienes vehículos registrados</p>
              </div>
            )}

            {vehicles.map(v => (
              <div key={v.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{v.plate}</p>
                    <p className="text-xs text-gray-500">
                      {v.vehicle_type}{v.brand ? ` · ${v.brand}` : ''}{v.model ? ` ${v.model}` : ''}{v.color ? ` · ${v.color}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteVehicle(v.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                  title="Eliminar vehículo"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            {showVehicleForm && (
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 mt-2">
                <p className="text-sm font-semibold text-gray-700 mb-3">Nuevo vehículo</p>
                <VehicleForm
                  onSubmit={handleAddVehicle}
                  onCancel={() => setShowVehicleForm(false)}
                  isLoading={isSavingVehicle}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Edit modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Editar Perfil">
        <div className="space-y-4">
          <div className="text-center mb-6">
            <Avatar
              src={editData.profilePicture || user?.profilePicture}
              alt={editData.fullName}
              size="xl"
              className="w-24 h-24 mx-auto"
            />
          </div>

          <Input
            label="Nombre Completo"
            value={editData.fullName}
            onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
            placeholder="Ingresa tu nombre completo"
          />
          
          <Input
            label="Correo Electrónico"
            value={user?.email || ''}
            disabled
            helperText="El correo no se puede modificar"
          />

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSave}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
