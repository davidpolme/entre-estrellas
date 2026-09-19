import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEvent } from '@/hooks/useEvent';
import type { EventStatus } from '@/types';

interface AdminPanelProps {
  username: string;
}

export function AdminPanel({ username }: AdminPanelProps) {
  const { status, adminStats, fetchAdminStats, startEvent, finishEvent } = useEvent();
  const [confirmStart, setConfirmStart] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  async function handleStart() {
    setActionLoading(true);
    await startEvent();
    setActionLoading(false);
    setConfirmStart(false);
    fetchAdminStats();
  }

  async function handleFinish() {
    setActionLoading(true);
    await finishEvent();
    setActionLoading(false);
    fetchAdminStats();
  }

  const statusLabels: Record<EventStatus, string> = {
    REGISTRATION_OPEN: 'Registro abierto',
    ACTIVE: 'Activo',
    FINISHED: 'Finalizado',
  };

  const statusColors: Record<EventStatus, string> = {
    REGISTRATION_OPEN: 'bg-yellow-500/20 text-yellow-400',
    ACTIVE: 'bg-green-500/20 text-green-400',
    FINISHED: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <motion.div
      className="max-w-lg mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
        <span className="text-sm text-white/40">@{username}</span>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/60">Estado del evento</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>

        {status === 'REGISTRATION_OPEN' && !confirmStart && (
          <button
            onClick={() => setConfirmStart(true)}
            className="w-full py-3 rounded-xl bg-green-500/20 text-green-400 font-medium hover:bg-green-500/30 transition-colors"
          >
            Iniciar actividad
          </button>
        )}

        {confirmStart && (
          <div className="space-y-2">
            <p className="text-sm text-yellow-400">
              ¿Estás seguro? Esto generará las asignaciones y activará el evento.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-xl bg-green-500 text-white font-medium text-sm disabled:opacity-50"
              >
                {actionLoading ? 'Iniciando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setConfirmStart(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-white/70 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {status === 'ACTIVE' && (
          <button
            onClick={handleFinish}
            disabled={actionLoading}
            className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {actionLoading ? 'Finalizando...' : 'Finalizar actividad'}
          </button>
        )}
      </div>

      {adminStats && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-semibold text-white">{adminStats.totalParticipants}</div>
              <div className="text-xs text-white/40 mt-1">Participantes</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-semibold text-white">{adminStats.totalLetters}</div>
              <div className="text-xs text-white/40 mt-1">Cartas totales</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-semibold text-white">{adminStats.communityLettersSent}</div>
              <div className="text-xs text-white/40 mt-1">Cartas comunitarias</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-semibold text-white">{adminStats.totalConnections}</div>
              <div className="text-xs text-white/40 mt-1">Conexiones</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <h3 className="text-sm text-white/60">Colores de estrellas</h3>
            <div className="space-y-1.5">
              {Object.entries(adminStats.colorDistribution).map(([color, count]) => (
                <div key={color} className="flex items-center justify-between text-sm">
                  <span className="text-white/70 capitalize">{color}</span>
                  <span className="text-white/50">{String(count)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}