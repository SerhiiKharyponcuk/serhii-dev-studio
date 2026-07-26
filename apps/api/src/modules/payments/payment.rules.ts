import type { PaymentStatus } from "../../generated/prisma/enums.js";
import { AppError } from "../../utils/http.js";

export function nextManualPaymentStatus(
  current: PaymentStatus,
  action: "CLIENT_SUBMIT" | "ADMIN_APPROVE" | "ADMIN_REJECT"
) {
  if (action === "CLIENT_SUBMIT" && current === "PENDING") return "WAITING_CONFIRMATION" as const;
  if (action === "ADMIN_APPROVE" && current === "WAITING_CONFIRMATION") return "PAID" as const;
  if (action === "ADMIN_REJECT" && current === "WAITING_CONFIRMATION") return "FAILED" as const;
  throw new AppError(409, "Payment transition is not allowed", "INVALID_PAYMENT_TRANSITION");
}
