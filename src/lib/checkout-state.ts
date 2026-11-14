export type CheckoutState = {
  status: "idle" | "error";
  error: string | null;
};

export const initialCheckoutState: CheckoutState = {
  status: "idle",
  error: null,
};
