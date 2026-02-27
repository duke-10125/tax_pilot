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
      salary: 400000,
      otherIncome: 0,
      section80c: 0,
      section80dSelf: 0,
      section80dParents: 0,
      parentsSenior: false,
      homeLoanInterest: 0,
    };
    const result = service.calculateTax(input);
    expect(result.oldRegime.taxableIncome).toBe(350000); // 400k - 50k
    expect(result.oldRegime.totalTax).toBe(0); // Under 5L taxable
  });

  it('should calculate tax correctly for New Regime (No Tax Case)', () => {
    const input: TaxInput = {
      salary: 700000,
      otherIncome: 0,
      section80c: 0,
      section80dSelf: 0,
      section80dParents: 0,
      parentsSenior: false,
      homeLoanInterest: 0,
    };
    const result = service.calculateTax(input);
    expect(result.newRegime.taxableIncome).toBe(650000); // 700k - 50k
    expect(result.newRegime.totalTax).toBe(0); // Under 7L taxable
  });

  it('should correctly calculate higher tax slabs', () => {
    const input: TaxInput = {
      salary: 1500000,
      otherIncome: 0,
      section80c: 150000,
      section80dSelf: 25000,
      section80dParents: 25000,
      parentsSenior: false,
      homeLoanInterest: 0,
    };
    const result = service.calculateTax(input);

    // Old Regime: 1.5M - 50k - 150k - 25k - 25k = 1,250,000
    // Tax: (250,000 * 0.3) + (500,000 * 0.2) + (250,000 * 0.05) = 75,000 + 100,000 + 12,500 = 187,500
    // Cess (4%): 187,500 * 0.04 = 7500
    // Total: 195,000
    expect(result.oldRegime.taxableIncome).toBe(1250000);
    expect(result.oldRegime.totalTax).toBe(195000);

    // New Regime: 1.5M - 50k = 1,450,000
    // Tax: (1,450,000 - 1,200,000) * 0.2 + (300,000 * 0.15) + (300,000 * 0.1) + (300,000 * 0.05)
    // = (250,000 * 0.2) + 45,000 + 30,000 + 15,000 = 50,000 + 90,000 = 140,000
    // Cess (4%): 140,000 * 0.04 = 5600
    // Total: 145,600
    expect(result.newRegime.taxableIncome).toBe(1450000);
    expect(result.newRegime.totalTax).toBe(145600);
  });
});
