'use client';

import { useEffect, useState } from 'react';

interface LogEmail {
  id: string;
  pedidoId?: string;
  email?: string;
  destinatario?: string;
  erroMensagem?: string;
  createdAt: string;
  pedido?: {
    id: string;
  };
}

export default function SupportPage() {
  const [failedEmails, setFailedEmails] = useState<LogEmail[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

    const fetchFailedEmails = async () => {
    try {
      const res = await fetch('http://localhost:3000/support/failed-emails', { 
	  cache: 'no-store'
      });
      const data = await res.json();
      setFailedEmails(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar e-mails com falha:', err);
    }
  };

  useEffect(() => {
    fetchFailedEmails();
  }, []);

  const handleResend = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`http://localhost:3000/support/resend-email/${id}`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('E-mail enviado para reprocessamento!');
        fetchFailedEmails();
      } else {
        alert('Erro ao processar o reenvio.');
      }
    } catch (err) {
      alert('Falha na comunicação com o servidor.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <main className="p-8 max-w-6xl mx-auto font-sans">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">🛠️ Painel do Suporte — João</h1>
        <p className="text-gray-600">
          Gerenciamento e reenvio manual de e-mails de ingressos que apresentaram falha no disparo.
        </p>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg border">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-100 uppercase text-xs text-gray-600">
            <tr>
              <th className="px-6 py-3">ID / Pedido</th>
              <th className="px-6 py-3">Destinatário</th>
              <th className="px-6 py-3">Mensagem de Erro</th>
              <th className="px-6 py-3 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {failedEmails.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Nenhum envio com falha pendente.
                </td>
              </tr>
            ) : (
              failedEmails.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs">{item.pedidoId || item.pedido?.id || item.id}</td>
                  <td className="px-6 py-4">{item.destinatario || item.email || 'Não informado'}</td>
                  <td className="px-6 py-4 text-red-600 font-mono text-xs">{item.erroMensagem || 'Falha no disparo'}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleResend(item.id)}
                      disabled={loadingId === item.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-xs disabled:opacity-50 transition"
                    >
                      {loadingId === item.id ? 'Reenviando...' : 'Reenviar E-mail'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
