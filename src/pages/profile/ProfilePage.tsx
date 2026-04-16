import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Button, Input, Avatar, StarRating, Badge, Modal } from '../../components/ui';
import { mockTripHistory } from '../../services/mockData';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: user?.fullName || '',
    profilePicture: user?.profilePicture || '',
  });

  const handleSave = () => {
    updateUser(editData);
    setIsEditing(false);
  };

  const tripsByRole = {
    asPassenger: mockTripHistory.filter(t => t.role === 'PASSENGER'),
    asDriver: mockTripHistory.filter(t => t.role === 'DRIVER'),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarjeta de perfil */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-4">{user?.fullName}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <p className="text-sm text-gray-400 mt-1">{user?.university}</p>

            <div className="flex items-center justify-center gap-2 mt-4">
              <StarRating rating={user?.averageRating || 0} size="md" showValue />
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{user?.totalTrips}</p>
                <p className="text-sm text-gray-500">Viajes Totales</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{tripsByRole.asDriver.length}</p>
                <p className="text-sm text-gray-500">Como Conductor</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{tripsByRole.asPassenger.length}</p>
                <p className="text-sm text-gray-500">Como Pasajero</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                Editar Perfil
              </Button>
            </div>
          </div>
        </Card>

        {/* Historial de viajes */}
        <Card className="lg:col-span-2">
          <CardTitle>Historial de Viajes</CardTitle>
          
          <div className="mt-4 space-y-4">
            {mockTripHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <p>Aún no tienes historial de viajes</p>
              </div>
            ) : (
              mockTripHistory.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Avatar
                    src={trip.route.driver.profilePicture}
                    alt={trip.route.driver.fullName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {trip.route.origin.address} → {trip.route.destination.address}
                      </p>
                      <Badge variant={trip.role === 'DRIVER' ? 'primary' : 'info'} size="sm">
                        {trip.role === 'DRIVER' ? 'Conductor' : 'Pasajero'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(trip.date).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    {trip.rating && (
                      <div className="flex items-center gap-1">
                        <StarRating rating={trip.rating} size="sm" />
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      ${trip.route.price.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Modal editar perfil */}
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
            label="URL de Foto de Perfil"
            value={editData.profilePicture}
            onChange={(e) => setEditData({ ...editData, profilePicture: e.target.value })}
            placeholder="https://ejemplo.com/foto.jpg"
            helperText="Ingresa el enlace directo a tu imagen de perfil"
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