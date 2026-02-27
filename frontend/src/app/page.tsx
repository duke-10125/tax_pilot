'use client';

import { useAuth } from '@/context/AuthContext';
import AuthForm from '@/components/AuthForm';
import TaxDashboard from '@/components/TaxDashboard';

export default function Home() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="container-fluid bg-light min-vh-100 p-0">
      {!user ? (
        <div className="d-flex justify-content-center align-items-center vh-100 px-3">
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <div className="text-center mb-4">
              <h1 className="fw-bold text-primary">TaxPilot</h1>
              <p className="text-muted">Smart Tax Comparison for Salaried Individuals</p>
            </div>
            <AuthForm />
          </div>
        </div>
      ) : (
        <div className="p-4">
          <header className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
            <h1 className="fw-bold text-primary m-0">TaxPilot Dashboard</h1>
            <div className="d-flex align-items-center gap-3">
              <span className="text-muted d-none d-sm-inline">{user.email}</span>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={signOut}
              >
                Sign Out
              </button>
            </div>
          </header>

          <TaxDashboard />
        </div>
      )}
    </main>
  );
}
