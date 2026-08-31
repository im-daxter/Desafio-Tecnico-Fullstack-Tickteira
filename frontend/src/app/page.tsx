'use client';

import { useState, useEffect } from 'react';

interface LogEmail {
  id: string;
  compradorEmail: string;
  assunto: string;
  status: 'PENDENTE' | 'ENVIADO' | 'FALHOU';
  tentativas: number;
  erroMensagem?: string;
  createdAt: string;
}

export default function SuportePage() {
  const [logs, setLogs] = useState<LogEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const carregarLogs = async () => {
    try {
      const res = await fetch(`${apiUrl}/emails/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Erro ao buscar logs de e-mail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLogs();
    const interval = setInterval(carregarLogs, 5000); // Atualiza automaticamente a cada 5s
    return () => clearInterval(interval);
  }, []);

  const handleReenviar = async (id: string) => {
    try {
      await fetch(`${apiUrl}/emails/${id}/reenviar`, {
        method: 'POST',
      });
      carregarLogs();
    } catch (err) {
      alert('Erro ao solicitar reenvio.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Painel de Suporte - Monitoramento de E-mails
        </h1>

        {loading ? (
          <p className="text-gray-500">Carregando registros...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-700">
                  <th className="p-3">Data/Hora</th>
                  <th className="p-3">Destinatário</th>
                  <th className="p-3">Assunto</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Tentativas</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="p-3 text-gray-600">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 font-medium text-gray-800">{log.compradorEmail}</td>
                    <td className="p-3 text-gray-600">{log.assunto}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'ENVIADO'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'FALHOU'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{log.tentativas}</td>
                    <td className="p-3">
                      {log.status === 'FALHOU' && (
                        <button
                          onClick={() => handleReenviar(log.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition"
                        >
                          Reenviar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
