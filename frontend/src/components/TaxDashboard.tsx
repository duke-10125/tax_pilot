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
        basic_salary: 0,
        hra: 0,
        bonus: 0,
        gratuity: 0,
        special_allowance: 0,
        professional_tax: 0,
        pf_contribution: 0,
        leave_encashment: 0,
        employment_type: 'SALARIED' as 'SALARIED' | 'BUSINESS',
    });
    const [showDetailed, setShowDetailed] = useState(false);
    const [comparison, setComparison] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState<'OLD' | 'NEW' | null>(null);

    useEffect(() => {
        if (showDetailed) {
            const totalSalary = (profile.basic_salary || 0) + (profile.hra || 0) + (profile.special_allowance || 0) + (profile.bonus || 0) + (profile.gratuity || 0) + (profile.leave_encashment || 0);
            if (totalSalary !== profile.salary) {
                setProfile(prev => ({ ...prev, salary: totalSalary }));
            }
        }
    }, [showDetailed, profile.basic_salary, profile.hra, profile.special_allowance, profile.bonus, profile.gratuity, profile.leave_encashment]);

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
                    basic_salary: 0,
                    hra: 0,
                    bonus: 0,
                    gratuity: 0,
                    special_allowance: 0,
                    professional_tax: 0,
                    pf_contribution: 0,
                    leave_encashment: 0,
                    employment_type: 'SALARIED',
                });
                setComparison(null);
                setShowDetailed(false);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setProfile((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'employment_type' ? value : (parseFloat(value) || 0)),
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

        setLoading(true);
        try {
            const data = await api.uploadSalarySlip(file);
            if (data.success) {
                // Prepare new profile state
                const newProfile = {
                    ...profile,
                    ...data.data,
                };

                // If Section 80C is empty, prepopulate it with PF contribution
                if (newProfile.section_80c === 0 && newProfile.pf_contribution > 0) {
                    newProfile.section_80c = newProfile.pf_contribution;
                }

                // Calculate gross based on components immediately to avoid waiting for useEffect
                newProfile.salary = (newProfile.basic_salary || 0) + (newProfile.hra || 0) + (newProfile.special_allowance || 0) + (newProfile.bonus || 0) + (newProfile.gratuity || 0) + (newProfile.leave_encashment || 0);

                setProfile(newProfile);

                // Automatically trigger calculation/save
                const saveResult = await api.updateProfile(newProfile);
                setComparison(saveResult.comparison);

                alert(`${data.message}\n\nWe have automatically calculated your tax comparison based on these details.`);
            }
        } catch (err) {
            console.error('OCR failed:', err);
            alert('Failed to parse salary slip. Please try again or enter details manually.');
        } finally {
            setLoading(false);
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
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                            <h5 className="fw-bold m-0">Tax Profile Details</h5>
                            <div className="d-grid d-md-flex gap-2">
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
                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold text-primary">I am a...</label>
                                    <select className="form-select" name="employment_type" value={profile.employment_type} onChange={handleChange}>
                                        <option value="SALARIED">Salaried Employee</option>
                                        <option value="BUSINESS">Business Owner / Freelancer</option>
                                    </select>
                                </div>
                                {profile.employment_type === 'SALARIED' && (
                                    <div className="col-md-6 d-flex align-items-end mb-2">
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" id="showDetailed" checked={showDetailed} onChange={(e) => setShowDetailed(e.target.checked)} />
                                            <label className="form-check-label small" htmlFor="showDetailed">Show Detailed Salary Breakdown</label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">
                                        {profile.employment_type === 'SALARIED' ? 'Annual Gross Salary' : 'Annual Gross Income'}
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input
                                            type="number"
                                            className={`form-control ${showDetailed ? 'bg-light' : ''}`}
                                            name="salary"
                                            value={profile.salary === 0 ? '' : profile.salary}
                                            onChange={handleChange}
                                            placeholder="0"
                                            onFocus={(e) => e.target.select()}
                                            readOnly={showDetailed}
                                        />
                                    </div>
                                    {showDetailed ? (
                                        <small className="text-muted">Total of all salary components (including benefits)</small>
                                    ) : (
                                        <small className="text-muted">Enter your total annual {profile.employment_type === 'SALARIED' ? 'salary' : 'income'}</small>
                                    )}
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

                                {showDetailed && profile.employment_type === 'SALARIED' && (
                                    <>
                                        <div className="col-12"><small className="fw-bold text-primary text-uppercase">Salary Breakdown (Annualized)</small></div>

                                        <div className="col-6 col-md-4">
                                            <label className="form-label small fw-bold">Basic Salary</label>
                                            <input type="number" className="form-control form-control-sm" name="basic_salary" value={profile.basic_salary === 0 ? '' : profile.basic_salary} onChange={handleChange} placeholder="0" onFocus={(e) => e.target.select()} />
                                        </div>
                                        <div className="col-6 col-md-4">
                                            <label className="form-label small fw-bold">HRA</label>
                                            <input type="number" className="form-control form-control-sm" name="hra" value={profile.hra === 0 ? '' : profile.hra} onChange={handleChange} placeholder="0" onFocus={(e) => e.target.select()} />
                                        </div>
                                        <div className="col-6 col-md-4">
                                            <label className="form-label small fw-bold">Special Allowance</label>
                                            <input type="number" className="form-control form-control-sm" name="special_allowance" value={profile.special_allowance === 0 ? '' : profile.special_allowance} onChange={handleChange} placeholder="0" onFocus={(e) => e.target.select()} />
                                        </div>
                                        <div className="col-6 col-md-4">
                                            <label className="form-label small fw-bold">Bonus</label>
                                            <input type="number" className="form-control form-control-sm" name="bonus" value={profile.bonus === 0 ? '' : profile.bonus} onChange={handleChange} placeholder="0" onFocus={(e) => e.target.select()} />
                                        </div>
                                        <div className="col-6 col-md-4">
                                            <label className="form-label small fw-bold">Gratuity</label>
                                            <input type="number" className="form-control form-control-sm" name="gratuity" value={profile.gratuity === 0 ? '' : profile.gratuity} onChange={handleChange} placeholder="0" onFocus={(e) => e.target.select()} />
                                        </div>
                                        <div className="col-6 col-md-4">
                                            <label className="form-label small fw-bold">Leave Encashment</label>
                                            <input type="number" className="form-control form-control-sm" name="leave_encashment" value={profile.leave_encashment === 0 ? '' : profile.leave_encashment} onChange={handleChange} placeholder="0" onFocus={(e) => e.target.select()} />
                                        </div>
                                    </>
                                )}

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
                                    <label className="form-label small fw-bold text-danger">Professional Tax (Deduction)</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input type="number" className="form-control" name="professional_tax" value={profile.professional_tax === 0 ? '' : profile.professional_tax} onChange={handleChange} placeholder="0" onFocus={(e) => e.target.select()} />
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
                                    {profile.pf_contribution > 0 && <small className="text-muted">Includes PF: {formatCurrency(profile.pf_contribution)}</small>}
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
                        <div className="card-body p-3 p-md-4">
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
                <div className="card shadow-sm border-0 sticky-lg-top" style={{ top: '24px' }}>
                    <div className="card-body p-3 p-md-4">
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
                                        <div className="table-responsive">
                                            <table className="table table-sm table-borderless small mb-0" style={{ minWidth: '250px' }}>
                                                <thead>
                                                    <tr className="border-bottom bg-light">
                                                        <th className="py-2">Net Taxable Income</th>
                                                        <th className="text-end py-2">{formatCurrency(breakdownData.taxableIncome)}</th>
                                                    </tr>
                                                    <tr className="border-bottom">
                                                        <th className="pt-3">Slab Breakdown</th>
                                                        <th className="text-end pt-3">Tax</th>
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

                                    {comparison[comparison.suggestedRegime.toLowerCase() + 'Regime'].totalTax <= 10000 && (
                                        <div className="mt-3">
                                            <span className="fw-bold fs-4">"GAREEB"</span>
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
