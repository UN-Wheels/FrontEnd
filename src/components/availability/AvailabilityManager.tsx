import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui';
import {
  routesService,
  AvailabilityRuleItem,
  AvailabilityRule,
} from '../../services/routesService';

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface DateEntry {
  date: string;
  seats: string;
}

interface AvailabilityManagerProps {
  routeId: string;
}

export function AvailabilityManager({ routeId }: AvailabilityManagerProps) {
  const [rules, setRules] = useState<AvailabilityRuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [tab, setTab] = useState<'SPECIFIC_DATES' | 'WEEKLY_RECURRENCE'>('SPECIFIC_DATES');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // SPECIFIC_DATES form
  const [dateEntries, setDateEntries] = useState<DateEntry[]>([{ date: '', seats: '3' }]);

  // WEEKLY_RECURRENCE form
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [seatsPerOccurrence, setSeatsPerOccurrence] = useState('3');

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await routesService.getAvailabilityRules(routeId);
      setRules(data.rules ?? []);
    } catch {
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  }, [routeId]);

  useEffect(() => { loadRules(); }, [loadRules]);

  const handleDelete = async (ruleId: string) => {
    if (!window.confirm('¿Eliminar esta regla de disponibilidad?')) return;
    setDeletingId(ruleId);
    try {
      await routesService.deleteAvailabilityRule(routeId, ruleId);
      setRules(prev => prev.filter(r => r._id !== ruleId));
    } catch {
      alert('Error al eliminar la regla.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    setSaveError('');
    let rule: AvailabilityRule;

    if (tab === 'SPECIFIC_DATES') {
      const valid = dateEntries.filter(e => e.date && Number(e.seats) > 0);
      if (valid.length === 0) { setSaveError('Agrega al menos una fecha con cupos válidos.'); return; }
      rule = {
        kind: 'SPECIFIC_DATES',
        entries: valid.map(e => ({
          date: new Date(`${e.date}T00:00:00.000Z`).toISOString(),
          seats: Number(e.seats),
        })),
      };
    } else {
      if (weekdays.length === 0) { setSaveError('Selecciona al menos un día de la semana.'); return; }
      if (!rangeStart || !rangeEnd) { setSaveError('Define el rango de fechas.'); return; }
      if (Number(seatsPerOccurrence) <= 0) { setSaveError('Los cupos deben ser mayor a 0.'); return; }
      rule = {
        kind: 'WEEKLY_RECURRENCE',
        weekdays,
        rangeStart: new Date(`${rangeStart}T00:00:00.000Z`).toISOString(),
        rangeEnd: new Date(`${rangeEnd}T00:00:00.000Z`).toISOString(),
        seatsPerOccurrence: Number(seatsPerOccurrence),
      };
    }

    setIsSaving(true);
    try {
      await routesService.addAvailabilityRule(routeId, rule);
      await loadRules();
      // Reset form
      setDateEntries([{ date: '', seats: '3' }]);
      setWeekdays([]);
      setRangeStart('');
      setRangeEnd('');
      setSeatsPerOccurrence('3');
    } catch {
      setSaveError('Error al guardar la regla. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWeekday = (d: number) => {
    setWeekdays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-5">
      {/* Existing rules */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Disponibilidad configurada
        </p>
        {isLoading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin reglas definidas.</p>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule._id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="min-w-0 flex-1">
                  {rule.kind === 'SPECIFIC_DATES' ? (
                    (rule.entries ?? []).length === 1 ? (
                      <>
                        <p className="text-sm font-medium text-gray-800">
                          Fecha específica · {fmtDate((rule.entries ?? [])[0].date)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {(rule.entries ?? [])[0].seats} cupo{(rule.entries ?? [])[0].seats !== 1 ? 's' : ''}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-800">
                          Fechas específicas · {(rule.entries ?? []).length} fechas
                        </p>
                        <div className="mt-1 space-y-0.5">
                          {(rule.entries ?? []).map((e, i) => (
                            <p key={i} className="text-xs text-gray-500">
                              {fmtDate(e.date)} · {e.seats} cupo{e.seats !== 1 ? 's' : ''}
                            </p>
                          ))}
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-800">
                        Recurrencia semanal · {(rule.weekdays ?? []).map(d => WEEKDAY_LABELS[d]).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {rule.rangeStart ? fmtDate(rule.rangeStart) : ''} – {rule.rangeEnd ? fmtDate(rule.rangeEnd) : ''} · {rule.seatsPerOccurrence} cupos/día
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(rule._id)}
                  disabled={deletingId === rule._id}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-50"
                  title="Eliminar regla"
                >
                  {deletingId === rule._id ? (
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Add new rule */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Agregar nueva regla
        </p>

        {/* Tabs */}
        <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 mb-4">
          {(['SPECIFIC_DATES', 'WEEKLY_RECURRENCE'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-colors ${
                tab === t
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'SPECIFIC_DATES' ? 'Fechas específicas' : 'Recurrencia semanal'}
            </button>
          ))}
        </div>

        {tab === 'SPECIFIC_DATES' && (
          <div className="space-y-2">
            {dateEntries.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="date"
                  value={entry.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    const copy = [...dateEntries];
                    copy[idx] = { ...copy[idx], date: e.target.value };
                    setDateEntries(copy);
                  }}
                  className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={entry.seats}
                  onChange={e => {
                    const copy = [...dateEntries];
                    copy[idx] = { ...copy[idx], seats: e.target.value };
                    setDateEntries(copy);
                  }}
                  className="w-20 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Cupos"
                />
                {dateEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDateEntries(prev => prev.filter((_, i) => i !== idx))}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDateEntries(prev => [...prev, { date: '', seats: '3' }])}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              + Agregar fecha
            </button>
          </div>
        )}

        {tab === 'WEEKLY_RECURRENCE' && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">Días de la semana</p>
              <div className="flex gap-1.5 flex-wrap">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      weekdays.includes(idx)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1 font-medium">Fecha inicio</p>
                <input
                  type="date"
                  value={rangeStart}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setRangeStart(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1 font-medium">Fecha fin</p>
                <input
                  type="date"
                  value={rangeEnd}
                  min={rangeStart || new Date().toISOString().split('T')[0]}
                  onChange={e => setRangeEnd(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1 font-medium">Cupos por día</p>
              <input
                type="number"
                min="1"
                max="10"
                value={seatsPerOccurrence}
                onChange={e => setSeatsPerOccurrence(e.target.value)}
                className="w-24 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {saveError && (
          <p className="text-xs text-red-500 mt-2">{saveError}</p>
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          isLoading={isSaving}
          className="mt-4 w-full"
        >
          Guardar regla
        </Button>
      </div>
    </div>
  );
}
