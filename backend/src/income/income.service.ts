import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface TaxProfileDto {
    salary: number;
    other_income: number;
    tds: number;
    section_80c: number;
    section_80d_self: number;
    section_80d_parents: number;
    parents_senior: boolean;
    home_loan_interest: number;
}

@Injectable()
export class IncomeService {
    constructor(private supabaseService: SupabaseService) { }

    async getProfile(userId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('tax_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is code for "no rows found"
            throw error;
        }

        return data;
    }

    async upsertProfile(userId: string, data: TaxProfileDto) {
        const { data: profile, error } = await this.supabaseService
            .getClient()
            .from('tax_profiles')
            .upsert({ user_id: userId, ...data }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return profile;
    }
}
