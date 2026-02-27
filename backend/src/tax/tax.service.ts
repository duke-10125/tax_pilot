import { Injectable } from '@nestjs/common';

export interface TaxInput {
    salary: number;
    otherIncome: number;
    section80c: number;
    section80dSelf: number;
    section80dParents: number;
    parentsSenior: boolean;
    homeLoanInterest: number;
}

export interface TaxResult {
    taxableIncome: number;
    taxBeforeRebate: number;
    rebate87A: number;
    taxAfterRebate: number;
    cess: number;
    totalTax: number;
}

export interface ComparisonResult {
    oldRegime: TaxResult;
    newRegime: TaxResult;
    suggestedRegime: 'OLD' | 'NEW';
    savings: number;
}

@Injectable()
export class TaxService {
    private readonly STANDARD_DEDUCTION = 50000;

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
        taxableIncome -= this.STANDARD_DEDUCTION;
        taxableIncome -= Math.min(input.section80c, 150000);

        const dSelfCap = 25000;
        const dParentsCap = input.parentsSenior ? 50000 : 25000;
        taxableIncome -= Math.min(input.section80dSelf, dSelfCap);
        taxableIncome -= Math.min(input.section80dParents, dParentsCap);

        taxableIncome -= Math.min(input.homeLoanInterest, 200000);

        taxableIncome = Math.max(0, taxableIncome);

        let tax = 0;
        if (taxableIncome > 1000000) {
            tax += (taxableIncome - 1000000) * 0.3;
            tax += 500000 * 0.2;
            tax += 250000 * 0.05;
        } else if (taxableIncome > 500000) {
            tax += (taxableIncome - 500000) * 0.2;
            tax += 250000 * 0.05;
        } else if (taxableIncome > 250000) {
            tax += (taxableIncome - 250000) * 0.05;
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
        };
    }

    private calculateNewRegime(input: TaxInput): TaxResult {
        let taxableIncome = input.salary + input.otherIncome;

        // Deductions (Only standard deduction in New Regime)
        taxableIncome -= this.STANDARD_DEDUCTION;
        taxableIncome = Math.max(0, taxableIncome);

        let tax = 0;
        // Slabs: 0-3L (0%), 3-6L (5%), 6-9L (10%), 9-12L (15%), 12-15L (20%), 15L+ (30%)
        if (taxableIncome > 1500000) {
            tax += (taxableIncome - 1500000) * 0.3;
            tax += 300000 * 0.2;
            tax += 300000 * 0.15;
            tax += 300000 * 0.1;
            tax += 300000 * 0.05;
        } else if (taxableIncome > 1200000) {
            tax += (taxableIncome - 1200000) * 0.2;
            tax += 300000 * 0.15;
            tax += 300000 * 0.1;
            tax += 300000 * 0.05;
        } else if (taxableIncome > 900000) {
            tax += (taxableIncome - 900000) * 0.15;
            tax += 300000 * 0.1;
            tax += 300000 * 0.05;
        } else if (taxableIncome > 600000) {
            tax += (taxableIncome - 600000) * 0.1;
            tax += 300000 * 0.05;
        } else if (taxableIncome > 300000) {
            tax += (taxableIncome - 300000) * 0.05;
        }

        let rebate = 0;
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
        };
    }
}
