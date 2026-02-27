import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { IncomeService, TaxProfileDto } from './income.service';
import { TaxService } from '../tax/tax.service';
import { Request } from 'express';

@Controller('income')
export class IncomeController {
    constructor(
        private readonly incomeService: IncomeService,
        private readonly taxService: TaxService,
    ) { }

    @Get('profile')
    async getProfile(@Req() req: Request) {
        const userId = req['user'].id; // sub is for JWT, id is for Supabase User object
        const profile = await this.incomeService.getProfile(userId);

        if (!profile) {
            return { profile: null, comparison: null };
        }

        const comparison = this.taxService.calculateTax({
            salary: profile.salary,
            otherIncome: profile.other_income,
            section80c: profile.section_80c,
            section80dSelf: profile.section_80d_self,
            section80dParents: profile.section_80d_parents,
            parentsSenior: profile.parents_senior,
            homeLoanInterest: profile.home_loan_interest,
            professionalTax: profile.professional_tax,
            pfContribution: profile.pf_contribution,
            employmentType: profile.employment_type,
        });

        return { profile, comparison };
    }

    @Post('profile')
    async upsertProfile(@Req() req: Request, @Body() data: TaxProfileDto) {
        const userId = req['user'].id;
        const profile = await this.incomeService.upsertProfile(userId, data);

        const comparison = this.taxService.calculateTax({
            salary: profile.salary,
            otherIncome: profile.other_income,
            section80c: profile.section_80c,
            section80dSelf: profile.section_80d_self,
            section80dParents: profile.section_80d_parents,
            parentsSenior: profile.parents_senior,
            homeLoanInterest: profile.home_loan_interest,
            professionalTax: profile.professional_tax,
            pfContribution: profile.pf_contribution,
            employmentType: profile.employment_type,
        });

        return { profile, comparison };
    }
}
