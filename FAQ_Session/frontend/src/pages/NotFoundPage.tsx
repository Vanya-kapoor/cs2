import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-center">
        <div className="h-1 w-full bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600" />
        <div className="p-8">
          <div className="text-7xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">404</h1>
          <h2 className="text-lg font-semibold text-slate-600 mb-3">Page Not Found</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-7">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Home size={15} />
              Go to Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={15} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
