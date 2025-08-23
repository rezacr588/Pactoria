-- Add sample templates for contract creation
-- Date: 2025-01-23

INSERT INTO public.templates (
  title,
  category,
  description,
  content_md,
  content_json,
  created_by,
  is_public,
  published
) VALUES 
(
  'Non-Disclosure Agreement (NDA)',
  'nda',
  'Standard mutual non-disclosure agreement for protecting confidential information',
  '# Non-Disclosure Agreement

## Parties
- **Disclosing Party**: [PARTY_1_NAME]
- **Receiving Party**: [PARTY_2_NAME]

## Terms
This Agreement shall protect confidential information shared between the parties.

### 1. Definition of Confidential Information
Confidential Information includes all information disclosed by one party to the other...

### 2. Obligations
The Receiving Party agrees to:
- Keep all confidential information strictly confidential
- Use information only for the intended purpose
- Return or destroy information upon request

### 3. Term
This Agreement shall remain in effect for [DURATION] years from the date of signing.

**Signatures:**
- [PARTY_1_NAME]: _________________ Date: _______
- [PARTY_2_NAME]: _________________ Date: _______',
  '{
    "type": "contract",
    "variables": [
      {"name": "PARTY_1_NAME", "type": "text", "label": "First Party Name"},
      {"name": "PARTY_2_NAME", "type": "text", "label": "Second Party Name"},
      {"name": "DURATION", "type": "number", "label": "Duration (years)", "default": 2}
    ]
  }',
  (SELECT id FROM auth.users WHERE email = 'system@contractforge.com'),
  true,
  true
),
(
  'Service Agreement',
  'service',
  'Professional service agreement template for contractors and clients',
  '# Service Agreement

## Parties
- **Service Provider**: [PROVIDER_NAME]
- **Client**: [CLIENT_NAME]

## Services
The Service Provider agrees to provide the following services:
[SERVICE_DESCRIPTION]

## Compensation
- **Rate**: $[HOURLY_RATE] per hour
- **Payment Terms**: [PAYMENT_TERMS]
- **Total Estimated Cost**: $[TOTAL_COST]

## Timeline
- **Start Date**: [START_DATE]
- **Completion Date**: [END_DATE]

## Terms and Conditions
1. **Scope of Work**: [SCOPE_DETAILS]
2. **Deliverables**: [DELIVERABLES]
3. **Revisions**: Up to [REVISION_COUNT] revisions included
4. **Intellectual Property**: [IP_TERMS]

**Signatures:**
- [PROVIDER_NAME]: _________________ Date: _______
- [CLIENT_NAME]: _________________ Date: _______',
  '{
    "type": "contract",
    "variables": [
      {"name": "PROVIDER_NAME", "type": "text", "label": "Service Provider Name"},
      {"name": "CLIENT_NAME", "type": "text", "label": "Client Name"},
      {"name": "SERVICE_DESCRIPTION", "type": "textarea", "label": "Service Description"},
      {"name": "HOURLY_RATE", "type": "number", "label": "Hourly Rate"},
      {"name": "PAYMENT_TERMS", "type": "text", "label": "Payment Terms", "default": "Net 30 days"},
      {"name": "TOTAL_COST", "type": "number", "label": "Total Estimated Cost"},
      {"name": "START_DATE", "type": "date", "label": "Start Date"},
      {"name": "END_DATE", "type": "date", "label": "End Date"},
      {"name": "SCOPE_DETAILS", "type": "textarea", "label": "Scope of Work Details"},
      {"name": "DELIVERABLES", "type": "textarea", "label": "Deliverables"},
      {"name": "REVISION_COUNT", "type": "number", "label": "Number of Revisions", "default": 3},
      {"name": "IP_TERMS", "type": "text", "label": "Intellectual Property Terms"}
    ]
  }',
  (SELECT id FROM auth.users WHERE email = 'system@contractforge.com'),
  true,
  true
),
(
  'Employment Contract',
  'employment',
  'Standard employment agreement template for full-time employees',
  '# Employment Contract

## Employee Information
- **Name**: [EMPLOYEE_NAME]
- **Position**: [JOB_TITLE]
- **Department**: [DEPARTMENT]
- **Start Date**: [START_DATE]

## Compensation
- **Salary**: $[ANNUAL_SALARY] per year
- **Payment Schedule**: [PAYMENT_SCHEDULE]
- **Benefits**: [BENEFITS_PACKAGE]

## Work Schedule
- **Hours**: [WORK_HOURS] hours per week
- **Schedule**: [WORK_SCHEDULE]
- **Location**: [WORK_LOCATION]

## Terms of Employment
1. **Probationary Period**: [PROBATION_PERIOD] months
2. **Vacation Days**: [VACATION_DAYS] days per year
3. **Sick Leave**: [SICK_DAYS] days per year
4. **Notice Period**: [NOTICE_PERIOD] days

## Confidentiality
Employee agrees to maintain confidentiality of all company information.

**Signatures:**
- Employee: _________________ Date: _______
- Employer: _________________ Date: _______',
  '{
    "type": "contract",
    "variables": [
      {"name": "EMPLOYEE_NAME", "type": "text", "label": "Employee Full Name"},
      {"name": "JOB_TITLE", "type": "text", "label": "Job Title"},
      {"name": "DEPARTMENT", "type": "text", "label": "Department"},
      {"name": "START_DATE", "type": "date", "label": "Start Date"},
      {"name": "ANNUAL_SALARY", "type": "number", "label": "Annual Salary"},
      {"name": "PAYMENT_SCHEDULE", "type": "select", "label": "Payment Schedule", "options": ["Bi-weekly", "Monthly", "Semi-monthly"]},
      {"name": "BENEFITS_PACKAGE", "type": "textarea", "label": "Benefits Package"},
      {"name": "WORK_HOURS", "type": "number", "label": "Work Hours per Week", "default": 40},
      {"name": "WORK_SCHEDULE", "type": "text", "label": "Work Schedule", "default": "Monday-Friday, 9 AM - 5 PM"},
      {"name": "WORK_LOCATION", "type": "text", "label": "Work Location"},
      {"name": "PROBATION_PERIOD", "type": "number", "label": "Probationary Period (months)", "default": 3},
      {"name": "VACATION_DAYS", "type": "number", "label": "Vacation Days per Year", "default": 15},
      {"name": "SICK_DAYS", "type": "number", "label": "Sick Days per Year", "default": 5},
      {"name": "NOTICE_PERIOD", "type": "number", "label": "Notice Period (days)", "default": 14}
    ]
  }',
  (SELECT id FROM auth.users WHERE email = 'system@contractforge.com'),
  true,
  true
),
(
  'Rental Agreement',
  'other',
  'Residential rental agreement template for landlords and tenants',
  '# Rental Agreement

## Property Information
- **Address**: [PROPERTY_ADDRESS]
- **Type**: [PROPERTY_TYPE]
- **Bedrooms**: [BEDROOMS]
- **Bathrooms**: [BATHROOMS]

## Parties
- **Landlord**: [LANDLORD_NAME]
- **Tenant**: [TENANT_NAME]

## Lease Terms
- **Monthly Rent**: $[MONTHLY_RENT]
- **Security Deposit**: $[SECURITY_DEPOSIT]
- **Lease Start**: [LEASE_START]
- **Lease End**: [LEASE_END]
- **Payment Due**: [PAYMENT_DUE_DATE] of each month

## Rules and Regulations
1. **Pets**: [PET_POLICY]
2. **Smoking**: [SMOKING_POLICY]
3. **Guests**: [GUEST_POLICY]
4. **Maintenance**: [MAINTENANCE_TERMS]

## Utilities
Tenant responsible for: [TENANT_UTILITIES]
Landlord responsible for: [LANDLORD_UTILITIES]

**Signatures:**
- Landlord: _________________ Date: _______
- Tenant: _________________ Date: _______',
  '{
    "type": "contract",
    "variables": [
      {"name": "PROPERTY_ADDRESS", "type": "text", "label": "Property Address"},
      {"name": "PROPERTY_TYPE", "type": "select", "label": "Property Type", "options": ["Apartment", "House", "Condo", "Room"]},
      {"name": "BEDROOMS", "type": "number", "label": "Number of Bedrooms"},
      {"name": "BATHROOMS", "type": "number", "label": "Number of Bathrooms"},
      {"name": "LANDLORD_NAME", "type": "text", "label": "Landlord Name"},
      {"name": "TENANT_NAME", "type": "text", "label": "Tenant Name"},
      {"name": "MONTHLY_RENT", "type": "number", "label": "Monthly Rent"},
      {"name": "SECURITY_DEPOSIT", "type": "number", "label": "Security Deposit"},
      {"name": "LEASE_START", "type": "date", "label": "Lease Start Date"},
      {"name": "LEASE_END", "type": "date", "label": "Lease End Date"},
      {"name": "PAYMENT_DUE_DATE", "type": "select", "label": "Payment Due Date", "options": ["1st", "15th", "Last day"]},
      {"name": "PET_POLICY", "type": "select", "label": "Pet Policy", "options": ["No pets allowed", "Pets allowed with deposit", "Pets allowed"]},
      {"name": "SMOKING_POLICY", "type": "select", "label": "Smoking Policy", "options": ["No smoking", "Smoking allowed outside only", "Smoking allowed"]},
      {"name": "GUEST_POLICY", "type": "text", "label": "Guest Policy"},
      {"name": "MAINTENANCE_TERMS", "type": "textarea", "label": "Maintenance Terms"},
      {"name": "TENANT_UTILITIES", "type": "text", "label": "Tenant Utilities"},
      {"name": "LANDLORD_UTILITIES", "type": "text", "label": "Landlord Utilities"}
    ]
  }',
  (SELECT id FROM auth.users WHERE email = 'system@contractforge.com'),
  true,
  true
),
(
  'Purchase Agreement',
  'sales',
  'Purchase agreement template for buying and selling goods or services',
  '# Purchase Agreement

## Transaction Details
- **Item/Service**: [ITEM_DESCRIPTION]
- **Quantity**: [QUANTITY]
- **Unit Price**: $[UNIT_PRICE]
- **Total Price**: $[TOTAL_PRICE]

## Parties
- **Buyer**: [BUYER_NAME]
- **Seller**: [SELLER_NAME]

## Delivery Terms
- **Delivery Date**: [DELIVERY_DATE]
- **Delivery Location**: [DELIVERY_ADDRESS]
- **Shipping Method**: [SHIPPING_METHOD]
- **Shipping Cost**: $[SHIPPING_COST]

## Payment Terms
- **Payment Method**: [PAYMENT_METHOD]
- **Payment Schedule**: [PAYMENT_SCHEDULE]
- **Late Payment Fee**: [LATE_FEE]%

## Warranty and Returns
- **Warranty Period**: [WARRANTY_PERIOD]
- **Return Policy**: [RETURN_POLICY]

## Additional Terms
[ADDITIONAL_TERMS]

**Signatures:**
- Buyer: _________________ Date: _______
- Seller: _________________ Date: _______',
  '{
    "type": "contract",
    "variables": [
      {"name": "ITEM_DESCRIPTION", "type": "textarea", "label": "Item/Service Description"},
      {"name": "QUANTITY", "type": "number", "label": "Quantity"},
      {"name": "UNIT_PRICE", "type": "number", "label": "Unit Price"},
      {"name": "TOTAL_PRICE", "type": "number", "label": "Total Price"},
      {"name": "BUYER_NAME", "type": "text", "label": "Buyer Name"},
      {"name": "SELLER_NAME", "type": "text", "label": "Seller Name"},
      {"name": "DELIVERY_DATE", "type": "date", "label": "Delivery Date"},
      {"name": "DELIVERY_ADDRESS", "type": "text", "label": "Delivery Address"},
      {"name": "SHIPPING_METHOD", "type": "select", "label": "Shipping Method", "options": ["Ground", "Express", "Overnight", "Pickup"]},
      {"name": "SHIPPING_COST", "type": "number", "label": "Shipping Cost"},
      {"name": "PAYMENT_METHOD", "type": "select", "label": "Payment Method", "options": ["Cash", "Check", "Credit Card", "Bank Transfer", "PayPal"]},
      {"name": "PAYMENT_SCHEDULE", "type": "select", "label": "Payment Schedule", "options": ["Payment on delivery", "Net 30 days", "50% upfront, 50% on delivery", "Payment in advance"]},
      {"name": "LATE_FEE", "type": "number", "label": "Late Payment Fee (%)", "default": 1.5},
      {"name": "WARRANTY_PERIOD", "type": "text", "label": "Warranty Period", "default": "1 year"},
      {"name": "RETURN_POLICY", "type": "text", "label": "Return Policy", "default": "30 days"},
      {"name": "ADDITIONAL_TERMS", "type": "textarea", "label": "Additional Terms"}
    ]
  }',
  (SELECT id FROM auth.users WHERE email = 'system@contractforge.com'),
  true,
  true
);

-- Update template usage count and ratings for sample data
UPDATE public.templates SET 
  usage_count = FLOOR(RANDOM() * 100) + 10,
  rating = ROUND((RANDOM() * 2 + 3)::numeric, 1),
  reviews_count = FLOOR(RANDOM() * 20) + 5
WHERE published = true;