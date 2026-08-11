/**
 * @file orangeEnergy.schemas.js
 * @description OpenAPI 3.1 schemas for the Orange Energy business domain.
 *
 * These schemas mirror the Mongoose models defined in `src/models/`:
 *   - client.model.js  → Client
 *   - kit.model.js     → Kit
 *   - scoringData.model.js → ScoringData
 *
 * Data is fetched from the external Orange Energy API
 * (`ORANGE_ENERGY_API_URL`) and cached in MongoDB.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ClientIdentity:
 *       type: object
 *       description: Official identity document details for a client.
 *       properties:
 *         type:
 *           type: string
 *           description: Document type (e.g., 'NationalID', 'Passport').
 *           example: 'NationalID'
 *         number:
 *           type: string
 *           example: 'CD-1234567'
 *         issuedAt:
 *           type: string
 *           description: Issuing authority location.
 *           example: 'Kinshasa'
 *         issuedDate:
 *           type: string
 *           description: Date of issuance (YYYY-MM-DD).
 *           example: '2019-03-15'
 *
 *     ClientSocioEconomic:
 *       type: object
 *       description: >
 *         Socio-economic indicators used for credit scoring and eligibility
 *         assessment for the pay-as-you-go solar kit program.
 *       properties:
 *         profession:
 *           type: string
 *           example: 'Teacher'
 *         estimatedIncomeUSD:
 *           type: number
 *           format: float
 *           description: Estimated monthly income in US dollars.
 *           example: 250.00
 *         orangeMoneyAccountAgeMonths:
 *           type: integer
 *           description: Number of months since the Orange Money account was created.
 *           example: 18
 *         historicalRiskScore:
 *           type: number
 *           format: float
 *           description: >
 *             Historical payment risk score (0–100). Lower is better.
 *           example: 12.5
 *
 *     Client:
 *       type: object
 *       description: >
 *         An Orange Energy client eligible for a pay-as-you-go solar kit.
 *         Represents a synced record from the Orange Energy external API,
 *         persisted in MongoDB.
 *       required:
 *         - accountNumber
 *         - firstName
 *         - lastName
 *         - phone
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId.
 *           example: '64a1b2c3d4e5f6a7b8c9d0e1'
 *         accountNumber:
 *           type: string
 *           description: Unique Orange Energy account identifier.
 *           example: 'OE-2026-00142'
 *         firstName:
 *           type: string
 *           example: 'Jean-Pierre'
 *         lastName:
 *           type: string
 *           example: 'Kabila'
 *         birthDate:
 *           type: string
 *           description: Date of birth (YYYY-MM-DD).
 *           example: '1988-04-22'
 *         birthPlace:
 *           type: string
 *           example: 'Lubumbashi'
 *         nationality:
 *           type: string
 *           example: 'Congolaise'
 *         residenceAddress:
 *           type: string
 *           example: 'Av. Kasavubu 12, Kinshasa'
 *         phone:
 *           type: string
 *           description: Primary Orange Money phone number (used as natural key).
 *           example: '+243812345678'
 *         secondaryPhone:
 *           type: string
 *           nullable: true
 *           example: '+243898765432'
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *           example: 'jp.kabila@example.com'
 *         identity:
 *           $ref: '#/components/schemas/ClientIdentity'
 *         socioEconomic:
 *           $ref: '#/components/schemas/ClientSocioEconomic'
 *         syncStatus:
 *           type: string
 *           enum: [synced, pending]
 *           description: Sync state between MongoDB and the Orange Energy API.
 *           example: 'synced'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: '2026-01-10T08:00:00.000Z'
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: '2026-08-09T07:00:00.000Z'
 *
 *     KitGpsCoordinates:
 *       type: object
 *       description: GPS installation coordinates of the solar kit.
 *       properties:
 *         latitude:
 *           type: number
 *           format: double
 *           example: -4.3217
 *         longitude:
 *           type: number
 *           format: double
 *           example: 15.3219
 *
 *     Kit:
 *       type: object
 *       description: >
 *         A solar energy kit assigned to an Orange Energy client.
 *         Tracks subscription status, payment history, and physical installation.
 *       required:
 *         - kitId
 *         - clientPhone
 *         - offerName
 *       properties:
 *         _id:
 *           type: string
 *           example: '64a1b2c3d4e5f6a7b8c9d0e2'
 *         kitId:
 *           type: string
 *           description: Unique kit identifier assigned by Orange Energy.
 *           example: 'KIT-OE-00789'
 *         clientPhone:
 *           type: string
 *           description: Orange Money phone number of the kit owner.
 *           example: '+243812345678'
 *         offerName:
 *           type: string
 *           description: Commercial offer name (e.g., 'Solar Home 50W').
 *           example: 'Solar Home 50W'
 *         installationDate:
 *           type: string
 *           description: Date the kit was physically installed (YYYY-MM-DD).
 *           example: '2026-02-14'
 *         subscriptionFeePaid:
 *           type: boolean
 *           description: Whether the initial subscription fee has been paid.
 *           example: true
 *         periodicAmountUSD:
 *           type: number
 *           format: float
 *           description: Recurring payment amount in USD.
 *           example: 15.00
 *         status:
 *           type: string
 *           enum: [active, suspended, terminated]
 *           description: Current operational status of the kit.
 *           example: 'active'
 *         paidMonthsCount:
 *           type: integer
 *           description: Total number of successfully paid months.
 *           example: 6
 *         gpsCoordinates:
 *           $ref: '#/components/schemas/KitGpsCoordinates'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PaymentHistoryEntry:
 *       type: object
 *       description: A single payment transaction in a client's payment history.
 *       required:
 *         - paymentId
 *       properties:
 *         paymentId:
 *           type: string
 *           example: 'PAY-2026-08-001'
 *         clientPhone:
 *           type: string
 *           example: '+243812345678'
 *         amountUSD:
 *           type: number
 *           format: float
 *           example: 15.00
 *         date:
 *           type: string
 *           format: date-time
 *           example: '2026-08-01T10:30:00.000Z'
 *         status:
 *           type: string
 *           description: Payment processing status.
 *           example: 'completed'
 *         description:
 *           type: string
 *           example: 'Mensualité août 2026 — Solar Home 50W'
 *
 *     ScoringClientSummary:
 *       type: object
 *       description: Condensed client profile embedded in a scoring record.
 *       properties:
 *         accountNumber:
 *           type: string
 *           example: 'OE-2026-00142'
 *         firstName:
 *           type: string
 *           example: 'Jean-Pierre'
 *         lastName:
 *           type: string
 *           example: 'Kabila'
 *         orangeMoneyAccountAgeMonths:
 *           type: integer
 *           example: 18
 *         estimatedIncomeUSD:
 *           type: number
 *           example: 250.00
 *         profession:
 *           type: string
 *           example: 'Teacher'
 *         historicalRiskScore:
 *           type: number
 *           example: 12.5
 *
 *     ScoringSubscriptionSummary:
 *       type: object
 *       description: Active subscription context for credit scoring.
 *       properties:
 *         kitId:
 *           type: string
 *           example: 'KIT-OE-00789'
 *         offerName:
 *           type: string
 *           example: 'Solar Home 50W'
 *         status:
 *           type: string
 *           example: 'active'
 *         paidMonthsCount:
 *           type: integer
 *           example: 6
 *
 *     ScoringData:
 *       type: object
 *       description: >
 *         Composite credit-scoring view for a client, aggregating their
 *         profile, active kit subscription, and full payment history.
 *         Used by credit decisioning systems to evaluate pay-as-you-go risk.
 *       required:
 *         - clientPhone
 *       properties:
 *         _id:
 *           type: string
 *           example: '64a1b2c3d4e5f6a7b8c9d0e3'
 *         clientPhone:
 *           type: string
 *           description: Primary key — Orange Money phone number of the client.
 *           example: '+243812345678'
 *         client:
 *           $ref: '#/components/schemas/ScoringClientSummary'
 *         subscription:
 *           $ref: '#/components/schemas/ScoringSubscriptionSummary'
 *         paymentHistory:
 *           type: array
 *           description: Full chronological payment history for this client.
 *           items:
 *             $ref: '#/components/schemas/PaymentHistoryEntry'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Runtime no-op — JSDoc only.
