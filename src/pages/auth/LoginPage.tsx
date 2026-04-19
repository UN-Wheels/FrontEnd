import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
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
    initialValues: { email: '', password: '', rememberMe: false },
    validate: validateForm,
    onSubmit: async (formValues) => {
      try {
        setGeneralError('');
        await login({ email: formValues.email, password: formValues.password, rememberMe: formValues.rememberMe });
        navigate('/dashboard');
      } catch {
        setGeneralError('Correo o contraseña incorrectos. Por favor, inténtelo de nuevo.');
      }
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <p className="text-base font-semibold text-white/80">Bienvenido de nuevo</p>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Inicia sesión para encontrar tu próximo viaje
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="auth-label">Correo electrónico</label>
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

        {/* Contraseña */}
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

        {/* Recordarme + Olvidó contraseña */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                name="rememberMe"
                checked={values.rememberMe}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-4 h-4 rounded border transition-all duration-150 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center"
                style={{ borderColor: 'rgba(255,255,255,0.25)', background: values.rememberMe ? '#45acab' : 'rgba(255,255,255,0.06)' }}>
                {values.rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Recordarme</span>
          </label>

          <Link to="/forgot-password" className="text-sm font-medium text-primary/80 hover:text-primary transition-colors">
            ¿Olvidó su contraseña?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white text-sm transition-all duration-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
              Iniciar sesión
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Registro */}
      <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
          ¿No tiene una cuenta?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Regístrese
          </Link>
        </p>
      </div>

      {/* Demo hint */}
      <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Demo: cualquier correo con @ y contraseña de 8+ caracteres
      </p>
    </div>
  );
}
