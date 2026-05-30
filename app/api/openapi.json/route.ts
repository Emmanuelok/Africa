import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";

// OpenAPI 3.1 spec for the Sokoni v1 public API. Imports cleanly into Postman,
// Insomnia, openapi-typescript, swagger-ui, etc.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Sokoni API",
    version: "1.0.0",
    description:
      "AfCFTA compliance primitives — HS classification, Rules of Origin determination, tariff lookup, and Certificate of Origin generation. Authenticate every request with a `Bearer sk_live_...` or `sk_test_...` key obtained from the Sokoni dashboard.",
    contact: { name: "Sokoni support", email: "developers@sokoni.africa", url: `${SITE}/contact` },
    license: { name: "Source-available", url: `${SITE}/terms` }
  },
  servers: [
    { url: `${SITE}/api`, description: "Production" }
  ],
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Classification" },
    { name: "Origin" },
    { name: "Tariffs" },
    { name: "Certificates" },
    { name: "Shipments" }
  ],
  paths: {
    "/v1/classify": {
      post: {
        tags: ["Classification"],
        summary: "Classify a product to its HS-4 code",
        description: "Returns the most likely HS-4 code with a confidence score and up to three alternates. Requires the `classify` scope.",
        operationId: "classify",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ClassifyRequest" } } }
        },
        responses: {
          "200": {
            description: "Classification result",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ClassifyResponse" } } }
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/ScopeMissing" },
          "429": { $ref: "#/components/responses/RateLimited" }
        }
      }
    },
    "/v1/determine-origin": {
      post: {
        tags: ["Origin"],
        summary: "Determine AfCFTA Rules of Origin eligibility",
        description: "Applies the right chapter-specific RoO rule and returns qualifying status + reasoning. Requires the `determine-origin` scope.",
        operationId: "determineOrigin",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/OriginRequest" } } }
        },
        responses: {
          "200": {
            description: "Determination result",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OriginResponse" } } }
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/ScopeMissing" }
        }
      }
    },
    "/v1/tariff": {
      get: {
        tags: ["Tariffs"],
        summary: "Look up MFN and AfCFTA preferential rate",
        operationId: "lookupTariff",
        parameters: [
          { name: "hs", in: "query", required: true, description: "HS-4 code, e.g. 0901", schema: { type: "string" } },
          { name: "origin", in: "query", required: false, description: "ISO-2 country", schema: { type: "string", minLength: 2, maxLength: 2 } },
          { name: "destination", in: "query", required: false, description: "ISO-2 country", schema: { type: "string", minLength: 2, maxLength: 2 } }
        ],
        responses: {
          "200": {
            description: "Tariff lookup",
            content: { "application/json": { schema: { $ref: "#/components/schemas/TariffResponse" } } }
          },
          "401": { $ref: "#/components/responses/Unauthorized" }
        }
      }
    },
    "/v1/certificates": {
      post: {
        tags: ["Certificates"],
        summary: "Issue an AfCFTA Certificate of Origin",
        description: "Generates an Annex II Appendix I PDF, stores it, and returns a reference + verification URL. Idempotent on `Idempotency-Key`. Requires the `certificates` scope.",
        operationId: "createCertificate",
        parameters: [
          { name: "Idempotency-Key", in: "header", required: false, description: "Replay-safe within 24h", schema: { type: "string", maxLength: 255 } }
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CertificateRequest" } } }
        },
        responses: {
          "200": {
            description: "Issued certificate",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CertificateResponse" } } }
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "402": { $ref: "#/components/responses/QuotaExceeded" },
          "403": { $ref: "#/components/responses/ScopeMissing" },
          "429": { $ref: "#/components/responses/RateLimited" }
        }
      }
    },
    "/v1/shipments": {
      post: {
        tags: ["Shipments"],
        summary: "End-to-end shipment pipeline",
        description: "Classify → determine origin → compute savings → optionally generate certificate, in a single call. Idempotent on `Idempotency-Key`. Requires the `shipments` scope.",
        operationId: "createShipment",
        parameters: [
          { name: "Idempotency-Key", in: "header", required: false, description: "Replay-safe within 24h", schema: { type: "string", maxLength: 255 } }
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentRequest" } } }
        },
        responses: {
          "200": {
            description: "Shipment result",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentResponse" } } }
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "402": { $ref: "#/components/responses/QuotaExceeded" },
          "403": { $ref: "#/components/responses/ScopeMissing" },
          "429": { $ref: "#/components/responses/RateLimited" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "sk_live_<24> or sk_test_<24>",
        description: "Issue keys from /dashboard/api-keys. Per-endpoint scopes restrict what each key can call."
      }
    },
    responses: {
      Unauthorized: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      ScopeMissing: {
        description: "Key lacks the required scope",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      QuotaExceeded: {
        description: "Plan limit reached — upgrade in the dashboard",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      RateLimited: {
        description: "Per-key rate limit exceeded (60 req/min)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      }
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            oneOf: [
              { type: "string" },
              {
                type: "object",
                properties: { code: { type: "string" }, message: { type: "string" } }
              }
            ]
          },
          code: { type: "string", description: "Stable error code (e.g. quota_exceeded)" },
          used: { type: "integer", description: "Quota used (when applicable)" },
          limit: { type: "integer", description: "Quota limit (when applicable)" }
        }
      },
      ClassifyRequest: {
        type: "object",
        required: ["description"],
        properties: {
          description: { type: "string", maxLength: 2000, example: "Washed Arabica green coffee beans, AA grade, 60kg jute bags" }
        }
      },
      ClassifyResponse: {
        type: "object",
        properties: {
          hs_code: { type: "string", example: "0901" },
          description: { type: "string", example: "Coffee, not roasted, not decaffeinated" },
          confidence: { type: "number", format: "float", minimum: 0, maximum: 1 },
          reasoning: { type: "string" },
          source: { type: "string", enum: ["ai", "cache", "keyword"] },
          alternates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                hs_code: { type: "string" },
                description: { type: "string" },
                confidence: { type: "number" }
              }
            }
          }
        }
      },
      OriginRequest: {
        type: "object",
        required: ["hs_code", "origin", "destination"],
        properties: {
          hs_code: { type: "string", example: "0901" },
          origin: { type: "string", minLength: 2, maxLength: 2, example: "KE" },
          destination: { type: "string", minLength: 2, maxLength: 2, example: "NG" },
          whole_obtained: { type: "boolean" },
          has_cth: { type: "boolean" },
          rvc_percent: { type: "number", minimum: 0, maximum: 100 },
          substantial_transformation: { type: "boolean" }
        }
      },
      OriginResponse: {
        type: "object",
        properties: {
          qualifies: { type: "string", enum: ["yes", "no", "marginal"] },
          rule_applied: { type: "string" },
          reasoning: { type: "array", items: { type: "string" } },
          preferential_rate: { type: "number" },
          mfn_rate: { type: "number" },
          hs_code: { type: "string" },
          origin: { type: "string" },
          destination: { type: "string" }
        }
      },
      TariffResponse: {
        type: "object",
        properties: {
          hs_code: { type: "string" },
          origin: { type: "string", nullable: true },
          destination: { type: "string", nullable: true },
          mfn_rate: { type: "number", nullable: true },
          afcfta_rate: { type: "number", nullable: true },
          description: { type: "string", nullable: true }
        }
      },
      Party: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", maxLength: 200 },
          address: { type: "string", maxLength: 500 }
        }
      },
      CertificateRequest: {
        type: "object",
        required: ["determination_id", "hs_code", "origin", "destination", "exporter", "consignee"],
        properties: {
          determination_id: { type: "string", description: "Returned by /v1/determine-origin or /v1/shipments" },
          hs_code: { type: "string" },
          origin: { type: "string", minLength: 2, maxLength: 2 },
          destination: { type: "string", minLength: 2, maxLength: 2 },
          exporter: { $ref: "#/components/schemas/Party" },
          consignee: { $ref: "#/components/schemas/Party" }
        }
      },
      CertificateResponse: {
        type: "object",
        properties: {
          certificate_id: { type: "string" },
          reference: { type: "string", example: "AFCFTA-K9P4XJ02" },
          pdf_url: { type: "string", format: "uri" },
          qr_verification_url: { type: "string", format: "uri" },
          issued_at: { type: "string", format: "date-time" }
        }
      },
      ShipmentRequest: {
        type: "object",
        required: ["description", "origin", "destination"],
        properties: {
          description: { type: "string", maxLength: 2000 },
          origin: { type: "string", minLength: 2, maxLength: 2 },
          destination: { type: "string", minLength: 2, maxLength: 2 },
          quantity: { type: "number" },
          fob_value_usd: { type: "number" },
          whole_obtained: { type: "boolean" },
          has_cth: { type: "boolean" },
          rvc_percent: { type: "number" },
          substantial_transformation: { type: "boolean" },
          generate_certificate: { type: "boolean", default: false },
          exporter: { $ref: "#/components/schemas/Party" },
          consignee: { $ref: "#/components/schemas/Party" }
        }
      },
      ShipmentResponse: {
        type: "object",
        properties: {
          determination_id: { type: "string" },
          classification: { $ref: "#/components/schemas/ClassifyResponse" },
          origin: { $ref: "#/components/schemas/OriginResponse" },
          tariff: {
            type: "object",
            properties: {
              mfn_rate: { type: "number" },
              preferential_rate: { type: "number" },
              savings_usd: { type: "number" }
            }
          },
          certificate: {
            oneOf: [
              { $ref: "#/components/schemas/CertificateResponse" },
              { type: "null" }
            ]
          }
        }
      }
    }
  }
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" }
  });
}
