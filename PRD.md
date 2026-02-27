TaxPilot – MVP PRD
1. Overview

TaxPilot is a web-based tax comparison dashboard for salaried individuals in India.

It enables users to:

Compare Old vs New tax regimes

Track 80C and 80D deductions

Estimate refund or tax payable

Upload salary slip for auto-fill

Receive regime suggestion

No ITR filing in MVP.

2. Architecture

Frontend:

Next.js

Bootstrap 5

Axios

Supabase Auth (client-side)

Backend:

NestJS

REST API

Tax Calculation Service

OCR + Parsing Service

Database:

Supabase Postgres

3. Authentication

Handled by Supabase:

Email signup

Login

JWT-based session

Protected dashboard

Nest verifies Supabase JWT on protected APIs.

4. Core Modules
4.1 Income Module

Fields:

Annual Gross Salary

Other Income

TDS

4.2 Deduction Module
Standard Deduction

₹50,000 (Both regimes)

Section 80C

Cap ₹1,50,000
Single input field.

Section 80D

Inputs:

Self/Family Premium (cap 25K)

Parents Premium (cap 25K or 50K if senior toggle enabled)

Home Loan Interest

Cap ₹2,00,000
Old regime only.

5. Tax Logic
Old Regime Slabs

0–2.5L → 0%
2.5–5L → 5%
5–10L → 20%
10L+ → 30%

New Regime Slabs

0–3L → 0%
3–6L → 5%
6–9L → 10%
9–12L → 15%
12–15L → 20%
15L+ → 30%

Rebate – Section 87A

Old:
Taxable ≤ 5L → tax = 0

New:
Taxable ≤ 7L → tax = 0

Cess

4% on final tax.

6. Salary Slip Upload (MVP Scope)

Image upload

OCR extraction

LLM structured JSON output:

gross_salary

tds

basic_salary (optional)

hra (optional)

User confirmation before save

7. Regime Suggestion

Compare final tax values.
Display savings difference.

8. Database Schema

Table: tax_profiles

id (uuid)

user_id (uuid)

salary (numeric)

other_income (numeric)

tds (numeric)

section_80c (numeric)

section_80d_self (numeric)

section_80d_parents (numeric)

parents_senior (boolean)

home_loan_interest (numeric)

created_at

updated_at

🔥 Killer Agent Prompt (Nest + Next + Bootstrap)

Use this with your coding agent:

You are a senior full-stack engineer building a production-ready MVP called "TaxPilot".

Tech stack:

Frontend:

Next.js (App Router)

TypeScript

Bootstrap 5

Backend:

NestJS (modular architecture)

TypeScript

REST API

Auth & Database:

Supabase (Auth + Postgres)

Build the following:

Supabase authentication:

Email signup

Login

Logout

JWT session handling

Protected dashboard route in Next.js

NestJS middleware to verify Supabase JWT

Dashboard UI (Bootstrap-based):

Clean card layout

Form sections:
Income
Deductions
Results

Income fields:

Annual Salary

Other Income

TDS

Deduction fields:

Section 80C (cap 1.5L)

80D Self (cap 25K)

80D Parents (cap 25K default)

Parents Senior toggle (if true cap 50K)

Home loan interest (cap 2L)

Salary slip upload:

Accept image

Send to backend OCR service

Extract text

Convert to structured JSON

Return parsed values

Prefill form

Allow manual editing

Tax engine (NestJS service):

Config-driven slab structure

Standard deduction 50,000

Section 87A rebate logic

4% cess

Old vs New comparison

Refund calculation

Regime suggestion

Output display:

Tax under Old

Tax under New

Refund / Payable

Suggested regime

Savings difference

Constraints:

Clean modular folder structure

Separate TaxService

No capital gains

No HRA exemption

No surcharge

Production-grade TypeScript

Secure API validation

Input validation (class-validator)

Output:

Complete folder structure

Supabase SQL schema

Full backend code

Full frontend code

Environment setup guide

Comments explaining tax logic clearly

Do not over-engineer.
Keep UI minimal and professional.