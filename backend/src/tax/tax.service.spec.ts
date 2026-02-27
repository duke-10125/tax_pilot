import { Test, TestingModule } from '@nestjs/testing';
import { TaxService, TaxInput } from './tax.service';

describe('TaxService', () => {
  let service: TaxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxService],
    }).compile();

    service = module.get<TaxService>(TaxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate tax correctly for Old Regime (No Tax Case)', () => {
    const input: TaxInput = {
      salary: 550000,
      otherIncome: 0,
      section80c: 50000,
      section80dSelf: 0,
      section80dParents: 0,
      parentsSenior: false,
      homeLoanInterest: 0,
    };
    const result = service.calculateTax(input);
    expect(result.oldRegime.taxableIncome).toBe(450000); // 550k - 50k (SD) - 50k (80C)
    expect(result.oldRegime.totalTax).toBe(0); // Under 5L taxable
  });

  it('should calculate tax correctly for New Regime (No Tax Case up to 7.75L)', () => {
    const input: TaxInput = {
      salary: 775000,
      otherIncome: 0,
      section80c: 0,
      section80dSelf: 0,
      section80dParents: 0,
      parentsSenior: false,
      homeLoanInterest: 0,
    };
    const result = service.calculateTax(input);
    expect(result.newRegime.taxableIncome).toBe(700000); // 775k - 75k (New SD)
    expect(result.newRegime.totalTax).toBe(0); // Rebate 87A covers up to 7L taxable
  });

  it('should correctly calculate higher tax slabs', () => {
    const input: TaxInput = {
      salary: 1575000,
      otherIncome: 0,
      section80c: 150000,
      section80dSelf: 25000,
      section80dParents: 25000,
      parentsSenior: false,
      homeLoanInterest: 0,
    };
    const result = service.calculateTax(input);

    // Old Regime: 1,575,000 - 50k (SD) - 150k (80C) - 25k - 25k = 1,325,000
    // Tax: (325,000 * 0.3) + (500,000 * 0.2) + (250,000 * 0.05) = 97,500 + 100,000 + 12,500 = 210,000
    // Cess (4%): 210,000 * 0.04 = 8400
    // Total: 218,400
    expect(result.oldRegime.taxableIncome).toBe(1325000);
    expect(result.oldRegime.totalTax).toBe(218400);

    // New Regime: 1,575,000 - 75k (New SD) = 1,500,000
    // Tax: (400,000 * 0.05) + (300,000 * 0.10) + (200,000 * 0.15) + (300,000 * 0.20)
    // = 20,000 + 30,000 + 30,000 + 60,000 = 140,000
    // Cess (4%): 140,000 * 0.04 = 5600
    // Total: 145,600
    expect(result.newRegime.taxableIncome).toBe(1500000);
    expect(result.newRegime.totalTax).toBe(145600);
  });
});
