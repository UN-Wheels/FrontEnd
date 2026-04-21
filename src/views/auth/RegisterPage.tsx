'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import { ValidationError } from '../../types';

interface RegisterFormValues {
  fullName: string;
  email: string;
  phone_number: string;
  age: string;
  major: string;
  gender: string;
  role: string;
  password: string;
  confirmPassword: string;
}

export function RegisterPage() {
  const router = useRouter();
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
    } else if (!values.email.toLowerCase().endsWith('@unal.edu.co')) {
      errors.push({ field: 'email', message: 'Solo se permiten correos @unal.edu.co' });
    }
    if (!values.phone_number.trim()) {
      errors.push({ field: 'phone_number', message: 'El teléfono es obligatorio' });
    }
    if (!values.age || Number(values.age) <= 0) {
      errors.push({ field: 'age', message: 'Ingresa una edad válida' });
    }
    if (!values.major.trim()) {
      errors.push({ field: 'major', message: 'La carrera es obligatoria' });
    }
    if (!values.gender) {
      errors.push({ field: 'gender', message: 'Selecciona un género' });
    }
    if (!values.role) {
      errors.push({ field: 'role', message: 'Selecciona un rol' });
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
    initialValues: {
      fullName: '',
      email: '',
      phone_number: '',
      age: '',
      major: '',
      gender: '',
      role: '',
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
          password: formValues.password,
          confirmPassword: formValues.confirmPassword,
          phone_number: formValues.phone_number,
          gender: formValues.gender as 'masculino' | 'femenino' | 'otro',
          major: formValues.major,
          age: Number(formValues.age),
          role: formValues.role as 'estudiante' | 'docente',
        });
        router.push('/dashboard');
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

        {/* Teléfono + Edad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="phone_number" className="auth-label">Teléfono</label>
            <input
              id="phone_number"
              type="tel"
              name="phone_number"
              placeholder="Ej. 3001234567"
              value={values.phone_number}
              onChange={handleChange}
              className={`auth-input ${getFieldError('phone_number') ? 'auth-input-error' : ''}`}
            />
            {getFieldError('phone_number') && (
              <p className="mt-1.5 text-xs text-red-400">{getFieldError('phone_number')}</p>
            )}
          </div>
          <div>
            <label htmlFor="age" className="auth-label">Edad</label>
            <input
              id="age"
              type="number"
              name="age"
              placeholder="Ej. 21"
              min="1"
              max="99"
              value={values.age}
              onChange={handleChange}
              className={`auth-input ${getFieldError('age') ? 'auth-input-error' : ''}`}
            />
            {getFieldError('age') && (
              <p className="mt-1.5 text-xs text-red-400">{getFieldError('age')}</p>
            )}
          </div>
        </div>

        {/* Carrera */}
        <div>
          <label htmlFor="major" className="auth-label">Carrera</label>
          <input
            id="major"
            type="text"
            name="major"
            placeholder="Ej. Ingeniería de Sistemas"
            value={values.major}
            onChange={handleChange}
            className={`auth-input ${getFieldError('major') ? 'auth-input-error' : ''}`}
          />
          {getFieldError('major') && (
            <p className="mt-1.5 text-xs text-red-400">{getFieldError('major')}</p>
          )}
        </div>

        {/* Género + Rol */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="gender" className="auth-label">Género</label>
            <select
              id="gender"
              name="gender"
              value={values.gender}
              onChange={handleChange}
              className={`auth-input ${getFieldError('gender') ? 'auth-input-error' : ''}`}
            >
              <option value="">Seleccionar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
            {getFieldError('gender') && (
              <p className="mt-1.5 text-xs text-red-400">{getFieldError('gender')}</p>
            )}
          </div>
          <div>
            <label htmlFor="role" className="auth-label">Rol</label>
            <select
              id="role"
              name="role"
              value={values.role}
              onChange={handleChange}
              className={`auth-input ${getFieldError('role') ? 'auth-input-error' : ''}`}
            >
              <option value="">Seleccionar</option>
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
            </select>
            {getFieldError('role') && (
              <p className="mt-1.5 text-xs text-red-400">{getFieldError('role')}</p>
            )}
          </div>
        </div>

        {/* Contraseñas */}
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
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Inicie sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
