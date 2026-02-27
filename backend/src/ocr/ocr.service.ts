import { Injectable } from '@nestjs/common';

@Injectable()
export class OcrService {
    async parseSalarySlip(file: Express.Multer.File) {
        // In a real implementation:
        // 1. Upload file to cloud storage (e.g., Supabase Storage)
        // 2. Send image URL to an OCR service (e.g., Google Vision API)
        // 3. Send extracted text to an LLM (e.g., OpenAI/Gemini) with a structured prompt

        console.log(`Processing file: ${file.originalname}`);

        // Mocking the result for MVP
        return {
            success: true,
            data: {
                salary: 1200000,
                tds: 50000,
                basic_salary: 600000,
                hra: 240000,
            },
            message: 'Salary slip parsed successfully (Mocked)',
        };
    }
}
