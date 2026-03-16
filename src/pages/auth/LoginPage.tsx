import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import { Button, Input } from '../../components/ui';
import { ValidationError } from '../../types';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [generalError, setGeneralError] = useState('');

  const validateForm = (values: LoginFormValues): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!values.email) {
      errors.push({ field: 'email', message: 'El correo electrónico es obligatorio' });
    } else if (!values.email.includes('@')) {
      errors.push({ field: 'email', message: 'Por favor, ingrese un correo válido' });
    }

    if (!values.password) {
      errors.push({ field: 'password', message: 'La contraseña es obligatoria' });
    } else if (values.password.length < 8) {
      errors.push({ field: 'password', message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    return errors;
  };

  const { values, handleChange, handleSubmit, getFieldError, isSubmitting } = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validate: validateForm,
    onSubmit: async (formValues) => {
      try {
        setGeneralError('');
        await login({
          email: formValues.email,
          password: formValues.password,
          rememberMe: formValues.rememberMe,
        });
        navigate('/dashboard');
      } catch {
        setGeneralError('Correo o contraseña incorrectos. Por favor, inténtelo de nuevo.');
      }
    },
  });

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Bienvenido de nuevo</h2>
        <p className="text-gray-200 mt-1">Inicie sesión en su cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {generalError}
          </div>
        )}

        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          placeholder="usuario@unal.edu.co"
          value={values.email}
          onChange={handleChange}
          error={getFieldError('email')}
          labelClassName="text-gray-200"
        />

        <Input
          label="Contraseña"
          type="password"
          name="password"
          placeholder="Ingrese su contraseña"
          value={values.password}
          onChange={handleChange}
          error={getFieldError('password')}
          labelClassName="text-gray-200"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="rememberMe"
              checked={values.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-200 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-200">Recordarme</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            ¿Olvidó su contraseña?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
        >
          Iniciar sesión
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-200">
          ¿No tiene una cuenta?{' '}
          <Link to="/register" className="text-primary hover:text-primary-dark font-medium">
            Regístrese
          </Link>
        </p>
      </div>

      {/* Demo credentials hint */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          <strong>Demo:</strong> Use cualquier correo con @ y una contraseña de más de 8 caracteres
        </p>
      </div>
    </div>
  );
}