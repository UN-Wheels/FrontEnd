import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
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
      errors.push({ field: 'fullName', message: 'Mínimo 3 caracteres' });
    }
    if (!values.email) {
      errors.push({ field: 'email', message: 'El correo es obligatorio' });
    } else if (!values.email.includes('@')) {
      errors.push({ field: 'email', message: 'Correo inválido' });
    } else if (!values.email.match(/.*@.*\.edu/i)) {
      errors.push({ field: 'email', message: 'Use su correo institucional (.edu)' });
    }
    if (!values.university) {
      errors.push({ field: 'university', message: 'Seleccione su universidad' });
    }
    if (!values.password) {
      errors.push({ field: 'password', message: 'La contraseña es obligatoria' });
    } else if (values.password.length < 8) {
      errors.push({ field: 'password', message: 'Mínimo 8 caracteres' });
    }
    if (!values.confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Confirme su contraseña' });
    } else if (values.password !== values.confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Las contraseñas no coinciden' });
    }
    return errors;
  };

  const { values, handleChange, handleSubmit, getFieldError, isSubmitting } = useForm<RegisterFormValues>({
    initialValues: { fullName: '', email: '', university: '', password: '', confirmPassword: '' },
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
      {/* Header */}
      <div className="mb-6">
        <p className="text-base font-semibold text-white/80">Crear cuenta</p>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Únete a la comunidad de carpooling universitario
        </p>
      </div>

      {/* Error general */}
      {generalError && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-300 flex items-center gap-2.5"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre completo */}
        <div>
          <label htmlFor="fullName" className="auth-label">Nombre completo</label>
          <input
            id="fullName"
            type="text"
            name="fullName"
            placeholder="Ej. María García"
            value={values.fullName}
            onChange={handleChange}
            className={`auth-input ${getFieldError('fullName') ? 'auth-input-error' : ''}`}
          />
          {getFieldError('fullName') && (
            <p className="mt-1.5 text-xs text-red-400">{getFieldError('fullName')}</p>
          )}
        </div>

        {/* Correo */}
        <div>
          <label htmlFor="email" className="auth-label">Correo institucional</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="usuario@unal.edu.co"
            value={values.email}
            onChange={handleChange}
            className={`auth-input ${getFieldError('email') ? 'auth-input-error' : ''}`}
          />
          {getFieldError('email') && (
            <p className="mt-1.5 text-xs text-red-400">{getFieldError('email')}</p>
          )}
        </div>

        {/* Universidad */}
        <div>
          <label htmlFor="university" className="auth-label">Universidad</label>
          <div className="relative">
            <select
              id="university"
              name="university"
              value={values.university}
              onChange={handleChange}
              className={`auth-input pr-10 ${getFieldError('university') ? 'auth-input-error' : ''}`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.35)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.25em 1.25em',
              }}
            >
              <option value="" disabled style={{ background: '#0e1730', color: 'rgba(255,255,255,0.5)' }}>
                Selecciona tu universidad
              </option>
              {universities.map((u) => (
                <option key={u.value} value={u.value} style={{ background: '#0e1730', color: 'white' }}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          {getFieldError('university') && (
            <p className="mt-1.5 text-xs text-red-400">{getFieldError('university')}</p>
          )}
        </div>

        {/* Contraseñas — 2 columnas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="password" className="auth-label">Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={values.password}
              onChange={handleChange}
              className={`auth-input ${getFieldError('password') ? 'auth-input-error' : ''}`}
            />
            {getFieldError('password') && (
              <p className="mt-1.5 text-xs text-red-400">{getFieldError('password')}</p>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="auth-label">Confirmar</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={values.confirmPassword}
              onChange={handleChange}
              className={`auth-input ${getFieldError('confirmPassword') ? 'auth-input-error' : ''}`}
            />
            {getFieldError('confirmPassword') && (
              <p className="mt-1.5 text-xs text-red-400">{getFieldError('confirmPassword')}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white text-sm transition-all duration-200 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: isSubmitting ? '#45acab' : 'linear-gradient(135deg, #45acab 0%, #3b9897 100%)',
            boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(69,172,171,0.35)',
          }}
        >
          {isSubmitting ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              Crear cuenta
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Login */}
      <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
          ¿Ya tiene una cuenta?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Inicie sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
