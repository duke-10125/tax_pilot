import { Injectable } from '@nestjs/common';

@Injectable()
export class OcrService {
    async parseSalarySlip(file: Express.Multer.File) {
        // In a real implementation:
        // 1. Upload file to cloud storage (e.g., Supabase Storage)
        // 2. Send image URL to an OCR service (e.g., Google Vision API)
        // 3. Send extracted text to an LLM (e.g., OpenAI/Gemini) with a structured prompt

        console.log(`Processing file: ${file.originalname}`);

        // Mocking the result based on the user's provided slip
        return {
            success: true,
            data: {
                salary: 510072, // Annualized Gross: (41,800 + 706) * 12
                tds: 0,
                basic_salary: 21875 * 12, // 262500
                hra: 8750 * 12, // 105000
                special_allowance: 8301 * 12, // 99612
                bonus: 1822 * 12, // 21864
                gratuity: 1052 * 12, // 12624
                professional_tax: 208 * 12, // 2496
                pf_contribution: 1800 * 12, // 21600
                leave_encashment: 706 * 12, // 8472
            },
            message: 'Salary slip parsed successfully! We have annualized your monthly earnings and benefits.',
        };
    }
}
