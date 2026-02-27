import { Injectable } from '@nestjs/common';

export interface TaxInput {
    salary: number;
    otherIncome: number;
    section80c: number;
    section80dSelf: number;
    section80dParents: number;
    parentsSenior: boolean;
    homeLoanInterest: number;
    professionalTax: number;
    pfContribution: number;
}

export interface SlabDetail {
    slab: string;
    rate: number;
    tax: number;
}

export interface TaxResult {
    taxableIncome: number;
    taxBeforeRebate: number;
    rebate87A: number;
    taxAfterRebate: number;
    cess: number;
    totalTax: number;
    slabBreakdown: SlabDetail[];
}

export interface ComparisonResult {
    oldRegime: TaxResult;
    newRegime: TaxResult;
    suggestedRegime: 'OLD' | 'NEW';
    savings: number;
}

@Injectable()
export class TaxService {
    private readonly OLD_STANDARD_DEDUCTION = 50000;
    private readonly NEW_STANDARD_DEDUCTION = 75000;

    calculateTax(input: TaxInput): ComparisonResult {
        const oldResult = this.calculateOldRegime(input);
        const newResult = this.calculateNewRegime(input);

        const savings = Math.abs(oldResult.totalTax - newResult.totalTax);
        const suggestedRegime = oldResult.totalTax <= newResult.totalTax ? 'OLD' : 'NEW';

        return {
            oldRegime: oldResult,
            newRegime: newResult,
            suggestedRegime,
            savings,
        };
    }

    private calculateOldRegime(input: TaxInput): TaxResult {
        let taxableIncome = input.salary + input.otherIncome;

        // Deductions
        taxableIncome -= input.professionalTax;
        taxableIncome -= this.OLD_STANDARD_DEDUCTION;

        // 80C includes manual input + PF contribution from slip
        const total80C = input.section80c + input.pfContribution;
        taxableIncome -= Math.min(total80C, 150000);

        const dSelfCap = 25000;
        const dParentsCap = input.parentsSenior ? 50000 : 25000;
        taxableIncome -= Math.min(input.section80dSelf, dSelfCap);
        taxableIncome -= Math.min(input.section80dParents, dParentsCap);

        taxableIncome -= Math.min(input.homeLoanInterest, 200000);

        taxableIncome = Math.max(0, taxableIncome);

        let tax = 0;
        const slabBreakdown: SlabDetail[] = [];

        // Old Slabs: 0-2.5L (0%), 2.5-5L (5%), 5-10L (20%), 10L+ (30%)
        if (taxableIncome > 1000000) {
            tax += (taxableIncome - 1000000) * 0.3;
            slabBreakdown.push({ slab: 'Above 10L', rate: 30, tax: (taxableIncome - 1000000) * 0.3 });
            tax += 500000 * 0.2;
            slabBreakdown.push({ slab: '5L - 10L', rate: 20, tax: 500000 * 0.2 });
            tax += 250000 * 0.05;
            slabBreakdown.push({ slab: '2.5L - 5L', rate: 5, tax: 250000 * 0.05 });
            slabBreakdown.push({ slab: '0 - 2.5L', rate: 0, tax: 0 });
        } else if (taxableIncome > 500000) {
            tax += (taxableIncome - 500000) * 0.2;
            slabBreakdown.push({ slab: '5L - 10L', rate: 20, tax: (taxableIncome - 500000) * 0.2 });
            tax += 250000 * 0.05;
            slabBreakdown.push({ slab: '2.5L - 5L', rate: 5, tax: 250000 * 0.05 });
            slabBreakdown.push({ slab: '0 - 2.5L', rate: 0, tax: 0 });
        } else if (taxableIncome > 250000) {
            tax += (taxableIncome - 250000) * 0.05;
            slabBreakdown.push({ slab: '2.5L - 5L', rate: 5, tax: (taxableIncome - 250000) * 0.05 });
            slabBreakdown.push({ slab: '0 - 2.5L', rate: 0, tax: 0 });
        } else {
            slabBreakdown.push({ slab: 'Up to 2.5L', rate: 0, tax: 0 });
        }

        let rebate = 0;
        if (taxableIncome <= 500000) {
            rebate = tax;
        }

        const taxAfterRebate = tax - rebate;
        const cess = taxAfterRebate * 0.04;
        const totalTax = taxAfterRebate + cess;

        return {
            taxableIncome,
            taxBeforeRebate: tax,
            rebate87A: rebate,
            taxAfterRebate,
            cess,
            totalTax,
            slabBreakdown: slabBreakdown.reverse(),
        };
    }

    private calculateNewRegime(input: TaxInput): TaxResult {
        let taxableIncome = input.salary + input.otherIncome;

        // Deductions
        taxableIncome -= input.professionalTax;
        taxableIncome -= this.NEW_STANDARD_DEDUCTION;
        taxableIncome = Math.max(0, taxableIncome);

        let tax = 0;
        const slabBreakdown: SlabDetail[] = [];

        /**
         * New Slabs (AY 2025-26):
         * 0-3L: Nil
         * 3-7L: 5%
         * 7-10L: 10%
         * 10-12L: 15%
         * 12-15L: 20%
         * Above 15L: 30%
         */
        if (taxableIncome > 1500000) {
            tax += (taxableIncome - 1500000) * 0.3;
            slabBreakdown.push({ slab: 'Above 15L', rate: 30, tax: (taxableIncome - 1500000) * 0.3 });
            tax += 300000 * 0.2;
            slabBreakdown.push({ slab: '12L - 15L', rate: 20, tax: 300000 * 0.2 });
            tax += 200000 * 0.15;
            slabBreakdown.push({ slab: '10L - 12L', rate: 15, tax: 200000 * 0.15 });
            tax += 300000 * 0.1;
            slabBreakdown.push({ slab: '7L - 10L', rate: 10, tax: 300000 * 0.1 });
            tax += 400000 * 0.05;
            slabBreakdown.push({ slab: '3L - 7L', rate: 5, tax: 400000 * 0.05 });
            slabBreakdown.push({ slab: '0 - 3L', rate: 0, tax: 0 });
        } else if (taxableIncome > 1200000) {
            tax += (taxableIncome - 1200000) * 0.2;
            slabBreakdown.push({ slab: '12L - 15L', rate: 20, tax: (taxableIncome - 1200000) * 0.2 });
            tax += 200000 * 0.15;
            slabBreakdown.push({ slab: '10L - 12L', rate: 15, tax: 200000 * 0.15 });
            tax += 300000 * 0.1;
            slabBreakdown.push({ slab: '7L - 10L', rate: 10, tax: 300000 * 0.1 });
            tax += 400000 * 0.05;
            slabBreakdown.push({ slab: '3L - 7L', rate: 5, tax: 400000 * 0.05 });
            slabBreakdown.push({ slab: '0 - 3L', rate: 0, tax: 0 });
        } else if (taxableIncome > 1000000) {
            tax += (taxableIncome - 1000000) * 0.15;
            slabBreakdown.push({ slab: '10L - 12L', rate: 15, tax: (taxableIncome - 1000000) * 0.15 });
            tax += 300000 * 0.1;
            slabBreakdown.push({ slab: '7L - 10L', rate: 10, tax: 300000 * 0.1 });
            tax += 400000 * 0.05;
            slabBreakdown.push({ slab: '3L - 7L', rate: 5, tax: 400000 * 0.05 });
            slabBreakdown.push({ slab: '0 - 3L', rate: 0, tax: 0 });
        } else if (taxableIncome > 700000) {
            tax += (taxableIncome - 700000) * 0.1;
            slabBreakdown.push({ slab: '7L - 10L', rate: 10, tax: (taxableIncome - 700000) * 0.1 });
            tax += 400000 * 0.05;
            slabBreakdown.push({ slab: '3L - 7L', rate: 5, tax: 400000 * 0.05 });
            slabBreakdown.push({ slab: '0 - 3L', rate: 0, tax: 0 });
        } else if (taxableIncome > 300000) {
            tax += (taxableIncome - 300000) * 0.05;
            slabBreakdown.push({ slab: '3L - 7L', rate: 5, tax: (taxableIncome - 300000) * 0.05 });
            slabBreakdown.push({ slab: '0 - 3L', rate: 0, tax: 0 });
        } else {
            slabBreakdown.push({ slab: 'Up to 3L', rate: 0, tax: 0 });
        }

        let rebate = 0;
        // Rebate under 87A for New Regime is for income up to 7L
        if (taxableIncome <= 700000) {
            rebate = tax;
        }

        const taxAfterRebate = tax - rebate;
        const cess = taxAfterRebate * 0.04;
        const totalTax = taxAfterRebate + cess;

        return {
            taxableIncome,
            taxBeforeRebate: tax,
            rebate87A: rebate,
            taxAfterRebate,
            cess,
            totalTax,
            slabBreakdown: slabBreakdown.reverse(),
        };
    }
}
