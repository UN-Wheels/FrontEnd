import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import { Button, Input, Select } from '../../components/ui';
import { ValidationError } from '../../types';

interface RegisterFormValues {
  fullName: string;
  email: string;
  university: string;
  password: string;
  confirmPassword: string;
}

const universities = [
  { value: 'uandes', label: 'Universidad de los Andes' },
  { value: 'javeriana', label: 'Pontificia Universidad Javeriana' },
  { value: 'unal', label: 'Universidad Nacional de Colombia' },
  { value: 'rosario', label: 'Universidad del Rosario' },
  { value: 'sabana', label: 'Universidad de la Sabana' },
  { value: 'externado', label: 'Universidad Externado de Colombia' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [generalError, setGeneralError] = useState('');

  const validateForm = (values: RegisterFormValues): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!values.fullName.trim()) {
      errors.push({ field: 'fullName', message: 'El nombre completo es obligatorio' });
    } else if (values.fullName.trim().length < 3) {
      errors.push({ field: 'fullName', message: 'El nombre debe tener al menos 3 caracteres' });
    }

    if (!values.email) {
      errors.push({ field: 'email', message: 'El correo electrónico es obligatorio' });
    } else if (!values.email.includes('@')) {
      errors.push({ field: 'email', message: 'Por favor, ingrese un correo válido' });
    } else if (!values.email.match(/.*@.*\.edu/i)) {
      errors.push({ field: 'email', message: 'Por favor, use su correo institucional (.edu)' });
    }

    if (!values.university) {
      errors.push({ field: 'university', message: 'Por favor, seleccione su universidad' });
    }

    if (!values.password) {
      errors.push({ field: 'password', message: 'La contraseña es obligatoria' });
    } else if (values.password.length < 8) {
      errors.push({ field: 'password', message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    if (!values.confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Por favor, confirme su contraseña' });
    } else if (values.password !== values.confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Las contraseñas no coinciden' });
    }

    return errors;
  };

  const { values, handleChange, handleSubmit, getFieldError, isSubmitting } = useForm<RegisterFormValues>({
    initialValues: {
      fullName: '',
      email: '',
      university: '',
      password: '',
      confirmPassword: '',
    },
    validate: validateForm,
    onSubmit: async (formValues) => {
      try {
        setGeneralError('');
        await register({
          fullName: formValues.fullName,
          email: formValues.email,
          university: formValues.university,
          password: formValues.password,
          confirmPassword: formValues.confirmPassword,
        });
        navigate('/dashboard');
      } catch {
        setGeneralError('Error en el registro. Por favor, intente de nuevo.');
      }
    },
  });

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Crear cuenta</h2>
        <p className="text-gray-200 mt-1">Únete a la comunidad UN Wheels</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {generalError}
          </div>
        )}

        <Input
          label="Nombre completo"
          type="text"
          name="fullName"
          placeholder="Ingrese su nombre completo"
          value={values.fullName}
          onChange={handleChange}
          error={getFieldError('fullName')}
          labelClassName="text-gray-200"
        />

        <Input
          label="Correo institucional"
          type="email"
          name="email"
          placeholder="usuario@unal.edu.co"
          value={values.email}
          onChange={handleChange}
          error={getFieldError('email')}
          helperText="Use su dirección de correo universitario"
          labelClassName="text-gray-200"
        />

        <Select
          label="Universidad"
          name="university"
          value={values.university}
          onChange={handleChange}
          options={universities}
          placeholder="Seleccione su universidad"
          error={getFieldError('university')}
          labelClassName="text-gray-200"
        />

        <Input
          label="Contraseña"
          type="password"
          name="password"
          placeholder="Cree una contraseña"
          value={values.password}
          onChange={handleChange}
          error={getFieldError('password')}
          helperText="Mínimo 8 caracteres"
          labelClassName="text-gray-200"
        />

        <Input
          label="Confirmar contraseña"
          type="password"
          name="confirmPassword"
          placeholder="Confirme su contraseña"
          value={values.confirmPassword}
          onChange={handleChange}
          error={getFieldError('confirmPassword')}
          labelClassName="text-gray-200"
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="lg"
            isLoading={isSubmitting}
          >
            Crear cuenta
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-200">
          ¿Ya tiene una cuenta?{' '}
          <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
            Inicie sesión
          </Link>
        </p>
      </div>
    </div>  
  );
}