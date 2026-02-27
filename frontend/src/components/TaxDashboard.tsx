'use client';

import { useState, useEffect } from 'react';
import * as api from '@/services/api';

interface SlabDetail {
    slab: string;
    rate: number;
    tax: number;
}

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
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState<'OLD' | 'NEW' | null>(null);

    useEffect(() => {
        // We start with a clean slate on refresh as requested.
        // Users can manually load their saved data if needed.
    }, []);

    const fetchData = async () => {
        try {
            const data = await api.getProfile();
            if (data.profile) {
                setProfile(data.profile);
                setComparison(data.comparison);
            } else {
                setProfile({
                    salary: 0,
                    other_income: 0,
                    tds: 0,
                    section_80c: 0,
                    section_80d_self: 0,
                    section_80d_parents: 0,
                    parents_senior: false,
                    home_loan_interest: 0,
                });
                setComparison(null);
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

    const getSuggestions = () => {
        if (!comparison) return [];
        const suggestions = [];
        const currentTotal = profile.section_80c + profile.section_80d_self + profile.section_80d_parents + profile.home_loan_interest;

        if (profile.section_80c < 150000) {
            suggestions.push({
                title: 'Increase 80C Investment',
                text: `You can save more by investing ₹${(150000 - profile.section_80c).toLocaleString()} more in PPF, ELSS, or LIC.`,
                icon: 'bi-piggy-bank'
            });
        }
        if (profile.section_80d_self < 25000) {
            suggestions.push({
                title: 'Health Insurance',
                text: 'Consider increasing your health insurance premium to claim up to ₹25,000 under Section 80D.',
                icon: 'bi-heart-pulse'
            });
        }
        if (profile.home_loan_interest === 0) {
            suggestions.push({
                title: 'Home Loan Benefit',
                text: 'If you have a home loan, you can claim up to ₹2L interest under Section 24.',
                icon: 'bi-house'
            });
        }
        return suggestions;
    };

    const InfoIcon = ({ text }: { text: string }) => (
        <span className="ms-1 text-muted cursor-help" title={text}>
            <i className="bi bi-info-circle small"></i>
        </span>
    );

    if (loading) return <div>Loading dashboard...</div>;

    const breakdownData = showBreakdown === 'OLD' ? comparison?.oldRegime : comparison?.newRegime;

    return (
        <div className="row g-4">
            <div className="col-lg-8">
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold m-0">Tax Profile Details</h5>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
                                    <i className="bi bi-arrow-clockwise me-2"></i>Load Saved Profile
                                </button>
                                <label className="btn btn-outline-primary btn-sm m-0">
                                    <i className="bi bi-upload me-2"></i>Upload Salary Slip
                                    <input type="file" hidden onChange={handleOcrUpload} accept="image/*" />
                                </label>
                            </div>
                        </div>

                        <form onSubmit={handleSave} autoComplete="off">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Annual Gross Salary</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="salary"
                                            value={profile.salary === 0 ? '' : profile.salary}
                                            onChange={handleChange}
                                            placeholder="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Other Income</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="other_income"
                                            value={profile.other_income === 0 ? '' : profile.other_income}
                                            onChange={handleChange}
                                            placeholder="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">TDS Already Paid</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="tds"
                                            value={profile.tds === 0 ? '' : profile.tds}
                                            onChange={handleChange}
                                            placeholder="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                </div>

                                <hr className="my-3" />
                                <h6 className="fw-bold mb-3 text-secondary">Deductions (Old Regime)</h6>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">
                                        Section 80C (Max 1.5L)
                                        <InfoIcon text="Investment in PPF, LIC, ELSS, NPS, etc." />
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="section_80c"
                                        value={profile.section_80c === 0 ? '' : profile.section_80c}
                                        onChange={handleChange}
                                        placeholder="0"
                                        onFocus={(e) => e.target.select()}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">
                                        80D Self Insurance (Max 25k)
                                        <InfoIcon text="Medical insurance premium for self, spouse, and children." />
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="section_80d_self"
                                        value={profile.section_80d_self === 0 ? '' : profile.section_80d_self}
                                        onChange={handleChange}
                                        placeholder="0"
                                        onFocus={(e) => e.target.select()}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">
                                        80D Parents Insurance
                                        <InfoIcon text="Medical insurance premium for parents." />
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="section_80d_parents"
                                        value={profile.section_80d_parents === 0 ? '' : profile.section_80d_parents}
                                        onChange={handleChange}
                                        placeholder="0"
                                        onFocus={(e) => e.target.select()}
                                    />
                                </div>
                                <div className="col-md-6 d-flex align-items-end mb-2">
                                    <div className="form-check form-switch">
                                        <input className="form-check-input" type="checkbox" name="parents_senior" checked={profile.parents_senior} onChange={handleChange} />
                                        <label className="form-check-label small">Parents are Senior Citizens (Max 50k)</label>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">
                                        Home Loan Interest (Max 2L)
                                        <InfoIcon text="Interest paid on home loan under Section 24." />
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="home_loan_interest"
                                        value={profile.home_loan_interest === 0 ? '' : profile.home_loan_interest}
                                        onChange={handleChange}
                                        placeholder="0"
                                        onFocus={(e) => e.target.select()}
                                    />
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

                {comparison && comparison[comparison.suggestedRegime.toLowerCase() + 'Regime'].totalTax > 0 && (
                    <div className="card shadow-sm border-0 mb-4 bg-light">
                        <div className="card-body p-4">
                            <h6 className="fw-bold mb-3"><i className="bi bi-lightbulb text-warning me-2"></i>Tax Saving Suggestions</h6>
                            <div className="row g-3">
                                {getSuggestions().map((s, i) => (
                                    <div key={i} className="col-md-6">
                                        <div className="d-flex bg-white p-3 rounded-3 shadow-xs h-100">
                                            <div className="me-3">
                                                <i className={`bi ${s.icon} fs-4 text-primary`}></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold small">{s.title}</div>
                                                <div className="text-muted small">{s.text}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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

                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted small">Old Regime Tax</span>
                                    <div>
                                        <span className="fw-bold me-2">{formatCurrency(comparison.oldRegime.totalTax)}</span>
                                        <button className="btn btn-link btn-sm p-0" onClick={() => setShowBreakdown('OLD')}>Details</button>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <span className="text-muted small">New Regime Tax</span>
                                    <div>
                                        <span className="fw-bold me-2">{formatCurrency(comparison.newRegime.totalTax)}</span>
                                        <button className="btn btn-link btn-sm p-0" onClick={() => setShowBreakdown('NEW')}>Details</button>
                                    </div>
                                </div>

                                {showBreakdown && (
                                    <div className="bg-light p-3 rounded-3 mb-4 border border-primary-subtle shadow-sm">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="fw-bold m-0">{showBreakdown} Regime Breakdown</h6>
                                            <button className="btn-close small" style={{ fontSize: '0.7rem' }} onClick={() => setShowBreakdown(null)}></button>
                                        </div>
                                        <table className="table table-sm table-borderless small mb-0">
                                            <thead>
                                                <tr className="border-bottom">
                                                    <th>Slab</th>
                                                    <th className="text-end">Tax</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {breakdownData.slabBreakdown.map((s: any, i: number) => (
                                                    <tr key={i}>
                                                        <td className="text-muted">{s.slab} ({s.rate}%)</td>
                                                        <td className="text-end fw-bold">{formatCurrency(s.tax)}</td>
                                                    </tr>
                                                ))}
                                                {breakdownData.rebate87A > 0 && (
                                                    <tr className="text-success">
                                                        <td>Rebate (Sec 87A)</td>
                                                        <td className="text-end">-{formatCurrency(breakdownData.rebate87A)}</td>
                                                    </tr>
                                                )}
                                                <tr className="border-top">
                                                    <td>Health & Edu Cess (4%)</td>
                                                    <td className="text-end">{formatCurrency(breakdownData.cess)}</td>
                                                </tr>
                                                <tr className="table-active">
                                                    <td className="fw-bold">Total Tax</td>
                                                    <td className="text-end fw-bold">{formatCurrency(breakdownData.totalTax)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

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
