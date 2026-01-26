import { useState } from 'react';

const TestButton = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestClick = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetch('/api/trigger-n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
      });
      
      if (!result.ok) {
        throw new Error(`Erreur: ${result.status}`);
      }
      
      const data = await result.json();
      setResponse(data.message || "Succès!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg">
      <button
        onClick={handleTestClick}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
      >
        {loading ? "Chargement..." : "TEST"}
      </button>
      
      {error && (
        <div className="text-red-500 mt-2">{error}</div>
      )}
      
      {response && (
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md">
          <p className="text-green-700">{response}</p>
        </div>
      )}
    </div>
  );
};

export default TestButton;