'use client';

import { useState, useEffect } from 'react';
import * as api from '@/services/api';

export default function TaxDashboard() {
    const [profile, setProfile] = useState({
        salary: 0,
        other_income: 0,
        tds: 0,
        section_80c: 0,
        section_80d_self: 0,
        section_80d_parents: 0,
        parents_senior: false,
        home_loan_interest: 0,
    });
    const [comparison, setComparison] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await api.getProfile();
            if (data.profile) {
                setProfile(data.profile);
                setComparison(data.comparison);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setProfile((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : parseFloat(value) || 0,
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = await api.updateProfile(profile);
            setComparison(data.comparison);
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await api.uploadSalarySlip(file);
            if (data.success) {
                setProfile((prev) => ({
                    ...prev,
                    salary: data.data.salary,
                    tds: data.data.tds,
                }));
                alert(data.message);
            }
        } catch (err) {
            console.error('OCR failed:', err);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="row g-4">
            <div className="col-lg-8">
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold m-0">Tax Profile Details</h5>
                            <div>
                                <label className="btn btn-outline-primary btn-sm m-0">
                                    <i className="bi bi-upload me-2"></i>Upload Salary Slip
                                    <input type="file" hidden onChange={handleOcrUpload} accept="image/*" />
                                </label>
                            </div>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Annual Gross Salary</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input type="number" className="form-control" name="salary" value={profile.salary} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Other Income</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input type="number" className="form-control" name="other_income" value={profile.other_income} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">TDS Already Paid</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input type="number" className="form-control" name="tds" value={profile.tds} onChange={handleChange} />
                                    </div>
                                </div>

                                <hr className="my-3" />
                                <h6 className="fw-bold mb-3 text-secondary">Deductions (Old Regime)</h6>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Section 80C (Max 1.5L)</label>
                                    <input type="number" className="form-control" name="section_80c" value={profile.section_80c} onChange={handleChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">80D Self Insurance (Max 25k)</label>
                                    <input type="number" className="form-control" name="section_80d_self" value={profile.section_80d_self} onChange={handleChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">80D Parents Insurance</label>
                                    <input type="number" className="form-control" name="section_80d_parents" value={profile.section_80d_parents} onChange={handleChange} />
                                </div>
                                <div className="col-md-6 d-flex align-items-end mb-2">
                                    <div className="form-check form-switch">
                                        <input className="form-check-input" type="checkbox" name="parents_senior" checked={profile.parents_senior} onChange={handleChange} />
                                        <label className="form-check-label small">Parents are Senior Citizens (Max 50k)</label>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Home Loan Interest (Max 2L)</label>
                                    <input type="number" className="form-control" name="home_loan_interest" value={profile.home_loan_interest} onChange={handleChange} />
                                </div>

                                <div className="col-12 mt-4">
                                    <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                                        {saving ? 'Calculating...' : 'Calculate & Save'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="col-lg-4">
                <div className="card shadow-sm border-0 sticky-top" style={{ top: '24px' }}>
                    <div className="card-body p-4">
                        <h5 className="fw-bold mb-4">Comparison Result</h5>

                        {comparison ? (
                            <div>
                                <div className="mb-4">
                                    <div className={`p-3 rounded-3 text-center mb-3 ${comparison.suggestedRegime === 'NEW' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'}`}>
                                        <small className="text-uppercase fw-bold">Recommended Regime</small>
                                        <h3 className="fw-bold m-0">{comparison.suggestedRegime === 'NEW' ? 'New Regime' : 'Old Regime'}</h3>
                                        <div className="small mt-1">Saves you {formatCurrency(comparison.savings)}</div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Old Regime Tax</span>
                                    <span className="fw-bold">{formatCurrency(comparison.oldRegime.totalTax)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-4">
                                    <span className="text-muted">New Regime Tax</span>
                                    <span className="fw-bold">{formatCurrency(comparison.newRegime.totalTax)}</span>
                                </div>

                                <hr />

                                <div className="text-center">
                                    {profile.tds > comparison[comparison.suggestedRegime.toLowerCase() + 'Regime'].totalTax ? (
                                        <div className="text-success">
                                            <i className="bi bi-cash-stack fs-1"></i>
                                            <div className="fw-bold mt-2">Estimated Refund</div>
                                            <h2 className="fw-bold">{formatCurrency(profile.tds - comparison[comparison.suggestedRegime.toLowerCase() + 'Regime'].totalTax)}</h2>
                                        </div>
                                    ) : (
                                        <div className="text-danger">
                                            <i className="bi bi-exclamation-circle fs-1"></i>
                                            <div className="fw-bold mt-2">Tax Payable</div>
                                            <h2 className="fw-bold">{formatCurrency(comparison[comparison.suggestedRegime.toLowerCase() + 'Regime'].totalTax - profile.tds)}</h2>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="alert alert-light border text-center">
                                Enter your details to see the comparison results.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
